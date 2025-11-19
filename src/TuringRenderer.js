import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

/**
 * Clase que renderiza visualmente la Máquina de Turing en 3D
 */
export class TuringRenderer {
    constructor(scene, turingMachine) {
        this.scene = scene;
        this.turingMachine = turingMachine;
        this.tapeGroup = new THREE.Group();
        this.headMesh = null;
        this.cellSize = 1.0;
        this.maxCells = 64;
        this.headPositionSet = false; // Flag para establecer posición del cabezal solo una vez
        this.previousHeadPosition = 0; // Para detectar movimientos
        this.visualOffset = 0; // Offset visual para simular el movimiento de la cinta
        
        // Parámetros para el óvalo/pista
        this.straightLength = 15; // Longitud de los lados rectos
        this.curveRadius = 8;     // Radio de las curvas en los extremos
        
        this.scene.add(this.tapeGroup);
        this.createTape();
        this.createHead();
    }

    createTape() {
        // Limpiar cinta anterior
        this.tapeGroup.clear();

        const tape = this.turingMachine.tape;
        
        // Asegurar que la cinta tenga al menos 64 celdas
        while (tape.length < this.maxCells) {
            tape.push('_');
        }
        
        // Mostrar todas las celdas (hasta maxCells)
        const cellsToShow = Math.min(tape.length, this.maxCells);
        
        // Detectar movimiento del cabezal
        const currentHeadPos = this.turingMachine.headPosition;
        if (currentHeadPos !== this.previousHeadPosition) {
            const movement = currentHeadPos - this.previousHeadPosition;
            // Si el cabezal se mueve a la derecha, offset aumenta (celdas se mueven a la izquierda)
            // Si el cabezal se mueve a la izquierda, offset disminuye (celdas se mueven a la derecha)
            this.visualOffset += movement;
            this.previousHeadPosition = currentHeadPos;
        }
        
        for (let i = 0; i < cellsToShow; i++) {
            // Calcular el índice visual ajustado por el offset
            const visualIndex = i - this.visualOffset;
            const cell = this.createCell(tape[i], visualIndex, cellsToShow);
            this.tapeGroup.add(cell);
        }
    }

    /**
     * Detecta movimiento del cabezal y rota la cinta incrementalmente
     */
    detectAndRotateTape(totalCells) {
        const currentHeadPos = this.turingMachine.headPosition;
        
        // Detectar si hubo movimiento
        if (currentHeadPos !== this.previousHeadPosition) {
            const movement = currentHeadPos - this.previousHeadPosition;
            
            // Calcular el ángulo de rotación por celda
            const straightPerimeter = this.straightLength * 2;
            const curvePerimeter = Math.PI * this.curveRadius * 2;
            const totalPerimeter = straightPerimeter + curvePerimeter;
            
            // Ángulo que corresponde a una celda
            const anglePerCell = (2 * Math.PI) / totalCells;
            
            // Si el cabezal se mueve a la derecha (+1), la cinta rota a la izquierda (-)
            // Si el cabezal se mueve a la izquierda (-1), la cinta rota a la derecha (+)
            this.currentRotation -= movement * anglePerCell;
            
            // Aplicar la rotación acumulada
            this.tapeGroup.rotation.z = this.currentRotation;
            
            // Actualizar posición anterior
            this.previousHeadPosition = currentHeadPos;
        }
    }

    /**
     * Rota toda la cinta para que la celda del cabezal quede en la posición 0
     * (MÉTODO DEPRECADO - ahora usamos detectAndRotateTape)
     */
    rotateTapeToHead(totalCells) {
        const headPos = this.turingMachine.headPosition;
        
        // Calcular el ángulo de rotación necesario
        const straightPerimeter = this.straightLength * 2;
        const curvePerimeter = Math.PI * this.curveRadius * 2;
        const totalPerimeter = straightPerimeter + curvePerimeter;
        
        // Distancia angular que debe rotar la cinta
        const headDistance = (headPos / totalCells) * totalPerimeter;
        const rotationAngle = (headDistance / totalPerimeter) * 2 * Math.PI;
        
        // Aplicar rotación al grupo de la cinta
        this.tapeGroup.rotation.z = -rotationAngle;
    }

    /**
     * Calcula la posición de una celda en la pista ovalada
     */
    getCellPosition(index, totalCells) {
        // Calcular el perímetro total de la pista
        const straightPerimeter = this.straightLength * 2;
        const curvePerimeter = Math.PI * this.curveRadius * 2;
        const totalPerimeter = straightPerimeter + curvePerimeter;
        
        // Ajustar para que index=0 esté en la parte superior central (0, curveRadius)
        // Empezamos en la mitad del lado superior
        const startOffset = this.straightLength / 2;
        
        // Distancia recorrida por esta celda
        const distance = ((index / totalCells) * totalPerimeter + startOffset) % totalPerimeter;
        
        let x, y, angle;
        
        // Lado superior recto (izquierda a derecha)
        if (distance < this.straightLength) {
            x = -this.straightLength / 2 + distance;
            y = this.curveRadius;
            angle = 0;
        }
        // Curva derecha (superior a inferior)
        else if (distance < this.straightLength + Math.PI * this.curveRadius) {
            const curveDistance = distance - this.straightLength;
            const curveAngle = curveDistance / this.curveRadius;
            x = this.straightLength / 2 + this.curveRadius * Math.sin(curveAngle);
            y = this.curveRadius * Math.cos(curveAngle);
            angle = curveAngle;
        }
        // Lado inferior recto (derecha a izquierda)
        else if (distance < straightPerimeter + Math.PI * this.curveRadius) {
            const straightDistance = distance - (this.straightLength + Math.PI * this.curveRadius);
            x = this.straightLength / 2 - straightDistance;
            y = -this.curveRadius;
            angle = Math.PI;
        }
        // Curva izquierda (inferior a superior)
        else {
            const curveDistance = distance - (straightPerimeter + Math.PI * this.curveRadius);
            const curveAngle = curveDistance / this.curveRadius;
            x = -this.straightLength / 2 - this.curveRadius * Math.sin(curveAngle);
            y = -this.curveRadius * Math.cos(curveAngle);
            angle = Math.PI + curveAngle;
        }
        
        return { x, y, angle };
    }

    createCell(symbol, visualPosition, totalCells) {
        const group = new THREE.Group();
        
        // La celda está iluminada si está en la posición visual 0 (debajo del cabezal)
        const isHeadPosition = visualPosition === 0;
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xff5e6c,
            metalness: 0.2,
            roughness: 0.3,
            emissive: 0xff5e6c,
            emissiveIntensity: isHeadPosition ? 0.5 : 0.1
        });
        
        // Dimensiones de la cápsula
        const width = 0.8;
        const height = 0.3;
        
        // Cuerpo central (cilindro horizontal)
        const cylinderGeometry = new THREE.CylinderGeometry(height, height, width, 32);
        const cylinder = new THREE.Mesh(cylinderGeometry, material);
        cylinder.rotation.z = Math.PI / 2; // Rotar horizontalmente
        group.add(cylinder);
        
        // Esfera izquierda
        const sphereGeometry = new THREE.SphereGeometry(height, 32, 32);
        const leftSphere = new THREE.Mesh(sphereGeometry, material);
        leftSphere.position.x = -width / 2;
        group.add(leftSphere);
        
        // Esfera derecha
        const rightSphere = new THREE.Mesh(sphereGeometry, material);
        rightSphere.position.x = width / 2;
        group.add(rightSphere);

        // Texto del símbolo - visible desde arriba
        const textPlane = this.createTextSprite(symbol, isHeadPosition);
        textPlane.position.y = height + 0.05; // Encima de la cápsula
        group.add(textPlane);

        // Calcular posición en la pista ovalada usando la posición visual
        const pos = this.getCellPosition(visualPosition, totalCells);
        
        group.position.x = pos.x;
        group.position.y = pos.y;
        group.position.z = 0;
        
        // Rotar la celda para que siga la tangente de la pista
        group.rotation.z = -pos.angle;
        
        return group;
    }

    createTextSprite(text, isActive = false) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        
        context.fillStyle = isActive ? '#ffffff' : '#333333';
        context.font = 'Bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Usar un PlaneGeometry para que sea visible desde arriba
        const planeGeometry = new THREE.PlaneGeometry(0.6, 0.6);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        
        // Rotar el plano para que sea visible desde arriba (paralelo al plano XZ)
        plane.rotation.x = -Math.PI / 2;
        
        return plane;
    }

    createHead() {
        // Crear cabezal lector/escritor (más pequeño)
        const geometry = new THREE.ConeGeometry(0.3, 1.0, 4);
        const material = new THREE.MeshStandardMaterial({
            color: 0xe74c3c,
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0xe74c3c,
            emissiveIntensity: 0.3
        });
        this.headMesh = new THREE.Mesh(geometry, material);
        this.headMesh.rotation.x = Math.PI; // Rotar 180 grados en X para que apunte hacia abajo
        
        // Posicionar el cabezal
        this.updateHeadPosition();
        
        this.scene.add(this.headMesh);
    }

    updateHeadPosition() {
        if (this.headMesh && !this.headPositionSet) {
            // El cabezal siempre está en la posición de la celda 0 (centro superior)
            const totalCells = Math.min(this.turingMachine.tape.length, this.maxCells);
            const pos = this.getCellPosition(0, totalCells);
            
            this.headMesh.position.x = pos.x;
            this.headMesh.position.z = 0; // Mismo Z que las celdas
            this.headMesh.position.y = pos.y + 1.5; // Arriba de la pista
            
            // Rotar el cabezal para seguir la orientación de la pista en la posición 0
            this.headMesh.rotation.z = -pos.angle;
            
            // Marcar que la posición ya fue establecida
            this.headPositionSet = true;
        }
    }

    update() {
        // Actualizar visualización de la cinta
        this.createTape();
        
        // Actualizar posición del cabezal (solo la primera vez)
        this.updateHeadPosition();
    }

    updateMachine(newTuringMachine) {
        // Actualizar referencia a la nueva máquina
        this.turingMachine = newTuringMachine;
        this.headPositionSet = false; // Resetear para recalcular posición con nueva máquina
        this.previousHeadPosition = 0; // Resetear posición previa
        this.visualOffset = 0; // Resetear offset visual
        this.createTape();
    }

    animateStep() {
        // Animación suave cuando se mueve el cabezal (opcional)
        // Se puede implementar con GSAP o tweening manual
    }
}
