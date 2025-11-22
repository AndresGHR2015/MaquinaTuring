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
        
        // Parámetros para el óvalo/pista (ajustados para 64 celdas juntas)
        // Con celdas de 0.8 de ancho, 64 celdas = 51.2 unidades de perímetro aproximado
        this.straightLength = 25; // Longitud de los lados rectos
        this.curveRadius = 5;     // Radio de las curvas en los extremos
        
        this.scene.add(this.tapeGroup);
        this.createBelt(); // Crear la correa primero (para que quede debajo)
        this.createFlatTape(); // Crear la cinta plana (sobre la correa, bajo las celdas)
        this.createTape();
        this.createHead();
    }

    /**
     * Crea la cinta plana mitad blanca y mitad negra
     */
    createFlatTape() {
        // Parámetros de la cinta
        const straightLength = this.straightLength * 1.01;
        const curveRadius = this.curveRadius * 0.96;
        const tapeWidth = 0.1; // Ancho de la cinta
        const tapeThickness = 1.5; // Grosor suficiente para cubrir el espacio de las celdas
        const halfStraight = straightLength / 2;
        const outerRadius = curveRadius + tapeWidth / 2;
        const innerRadius = curveRadius - tapeWidth / 2;
        
        // Crear la forma completa del óvalo (será la misma para ambas mitades)
        const shape = new THREE.Shape();
        
        // Comenzar en la parte superior izquierda
        shape.moveTo(-halfStraight, outerRadius);
        
        // Línea superior (izquierda a derecha)
        shape.lineTo(halfStraight, outerRadius);
        
        // Curva derecha exterior
        shape.absarc(halfStraight, 0, outerRadius, Math.PI / 2, -Math.PI / 2, true);
        
        // Línea inferior (derecha a izquierda)
        shape.lineTo(-halfStraight, -outerRadius);
        
        // Curva izquierda exterior
        shape.absarc(-halfStraight, 0, outerRadius, -Math.PI / 2, Math.PI / 2, true);
        
        // Crear el agujero interior
        const hole = new THREE.Path();
        hole.moveTo(-halfStraight, innerRadius);
        hole.lineTo(halfStraight, innerRadius);
        hole.absarc(halfStraight, 0, innerRadius, Math.PI / 2, -Math.PI / 2, true);
        hole.lineTo(-halfStraight, -innerRadius);
        hole.absarc(-halfStraight, 0, innerRadius, -Math.PI / 2, Math.PI / 2, true);
        
        shape.holes.push(hole);
        
        // ===== MITAD BLANCA (Z positivo - mitad frontal) =====
        const whiteExtrudeSettings = {
            depth: tapeThickness / 2, // Solo la mitad del grosor
            bevelEnabled: false
        };
        
        const whiteGeometry = new THREE.ExtrudeGeometry(shape, whiteExtrudeSettings);
        // Posicionar desde Z=0 hacia adelante
        whiteGeometry.translate(0, 0, 0);
        
        const whiteMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.1,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        const whiteTape = new THREE.Mesh(whiteGeometry, whiteMaterial);
        whiteTape.position.y = -0.05;
        this.scene.add(whiteTape);
        
        // ===== MITAD NEGRA (Z negativo - mitad trasera) =====
        const blackExtrudeSettings = {
            depth: tapeThickness / 2, // Solo la mitad del grosor
            bevelEnabled: false
        };
        
        const blackGeometry = new THREE.ExtrudeGeometry(shape, blackExtrudeSettings);
        // Posicionar desde Z=0 hacia atrás
        blackGeometry.translate(0, 0, -tapeThickness / 2);
        
        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        const blackTape = new THREE.Mesh(blackGeometry, blackMaterial);
        blackTape.position.y = -0.05;
        this.scene.add(blackTape);
    }

    /**
     * Crea la correa que va debajo de la cinta
     */
    createBelt() {
        // Parámetros deben coincidir con la cinta plana para que queden alineados
        const straightLength = this.straightLength * 0.98;
        const curveRadius = this.curveRadius * 0.93; // Mismo que la cinta plana
        const halfStraight = straightLength / 2;
        const tubeRadius = 0.2; // Radio del tubo (grosor de la correa)
        
        // Crear la curva que define el camino de la correa
        const curve = new THREE.CurvePath();
        
        // Línea superior (izquierda a derecha)
        curve.add(new THREE.LineCurve3(
            new THREE.Vector3(-halfStraight, curveRadius, 0),
            new THREE.Vector3(halfStraight, curveRadius, 0)
        ));
        
        // Curva derecha (semicírculo superior a inferior)
        const rightCurve = new THREE.EllipseCurve(
            halfStraight, 0,  // centro
            curveRadius, curveRadius,  // radios x, y
            Math.PI / 2, -Math.PI / 2,  // ángulo inicio, ángulo fin
            true, // sentido horario
            0  // rotación
        );
        const rightCurve3D = new THREE.CurvePath();
        const points = rightCurve.getPoints(32);
        for (let i = 0; i < points.length - 1; i++) {
            rightCurve3D.add(new THREE.LineCurve3(
                new THREE.Vector3(points[i].x, points[i].y, 0),
                new THREE.Vector3(points[i + 1].x, points[i + 1].y, 0)
            ));
        }
        curve.add(rightCurve3D);
        
        // Línea inferior (derecha a izquierda)
        curve.add(new THREE.LineCurve3(
            new THREE.Vector3(halfStraight, -curveRadius, 0),
            new THREE.Vector3(-halfStraight, -curveRadius, 0)
        ));
        
        // Curva izquierda (semicírculo inferior a superior)
        const leftCurve = new THREE.EllipseCurve(
            -halfStraight, 0,  // centro
            curveRadius, curveRadius,  // radios x, y
            -Math.PI / 2, Math.PI / 2,  // ángulo inicio, ángulo fin
            true, // sentido horario
            0  // rotación
        );
        const leftCurve3D = new THREE.CurvePath();
        const leftPoints = leftCurve.getPoints(32);
        for (let i = 0; i < leftPoints.length - 1; i++) {
            leftCurve3D.add(new THREE.LineCurve3(
                new THREE.Vector3(leftPoints[i].x, leftPoints[i].y, 0),
                new THREE.Vector3(leftPoints[i + 1].x, leftPoints[i + 1].y, 0)
            ));
        }
        curve.add(leftCurve3D);
        
        // Crear geometría de tubo siguiendo la curva
        const geometry = new THREE.TubeGeometry(curve, 128, tubeRadius, 16, true);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2c2c2c, // Gris oscuro
            metalness: 0.3,
            roughness: 0.7
        });
        
        const belt = new THREE.Mesh(geometry, material);
        
        // Posicionar la correa completamente debajo de la cinta plana
        belt.position.y = -0.05; // Más abajo para que no sobresalga por encima de la cinta
        
        this.scene.add(belt);
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
        
        // Dimensiones
        const cellWidth = 1.27;
        const cellHeight = 1.5;
        const frameThickness = 0.2; // Grosor del marco
        const innerDepth = 0.8; // Profundidad de la cavidad
        
        // 1. MARCO EXTERIOR NARANJA (hueco)
        const frameColor = 0xff8c42; // Naranja
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: frameColor,
            metalness: 0.3,
            roughness: 0.6
        });
        
        // Grosores diferentes para hacer el hueco rectangular
        const frameThicknessHorizontal = 0.15; // Grosor de barras superior/inferior (más delgadas)
        const frameThicknessVertical = 0.3;    // Grosor de barras izquierda/derecha (más gruesas)
        
        // Crear marco con 4 barras (arriba, abajo, izquierda, derecha)
        // Barra superior (más delgada)
        const topBar = new THREE.BoxGeometry(cellWidth, frameThickness, frameThicknessHorizontal);
        const topMesh = new THREE.Mesh(topBar, frameMaterial);
        topMesh.position.z = cellHeight / 2 - frameThicknessHorizontal / 2;
        group.add(topMesh);
        
        // Barra inferior (más delgada)
        const bottomBar = new THREE.BoxGeometry(cellWidth, frameThickness, frameThicknessHorizontal);
        const bottomMesh = new THREE.Mesh(bottomBar, frameMaterial);
        bottomMesh.position.z = -cellHeight / 2 + frameThicknessHorizontal / 2;
        group.add(bottomMesh);
        
        // Barra izquierda (más gruesa)
        const leftBar = new THREE.BoxGeometry(frameThicknessVertical, frameThickness, cellHeight - 2 * frameThicknessHorizontal);
        const leftMesh = new THREE.Mesh(leftBar, frameMaterial);
        leftMesh.position.x = -cellWidth / 2 + frameThicknessVertical / 2;
        group.add(leftMesh);
        
        // Barra derecha (más gruesa)
        const rightBar = new THREE.BoxGeometry(frameThicknessVertical, frameThickness, cellHeight - 2 * frameThicknessHorizontal);
        const rightMesh = new THREE.Mesh(rightBar, frameMaterial);
        rightMesh.position.x = cellWidth / 2 - frameThicknessVertical / 2;
        group.add(rightMesh);
        
        // 2. PIEZA MÓVIL INTERIOR (lámina delgada que se mueve en Z)
        const innerWidth = (cellWidth - 2 * frameThicknessVertical); // Ancho disponible
        const innerHeight = (cellHeight - 2 * frameThicknessHorizontal - 0.1) / 6; // Alto disponible
        const laminaThickness = 0.6; // Grosor de la lámina (muy delgada)
        
        // Determinar posición según el símbolo (la lámina siempre es naranja)
        let zPosition;
        switch(symbol) {
            case '1':
                zPosition = -0.3; // Atrás
                break;
            case '0':
                zPosition = 0; // Centro
                break;
            case '_':
                zPosition = 0.3; // Adelante
                break;
            default:
                zPosition = 0;
        }
        
        // La lámina siempre es del mismo color que el marco (naranja)
        const innerMaterial = new THREE.MeshStandardMaterial({
            color: frameColor, // Mismo color que el marco
            metalness: 0.2,
            roughness: 0.7
        });
        
        // Lámina delgada (BoxGeometry: ancho en X, alto en Y, grosor en Z)
        const innerGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, laminaThickness);
        const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
        innerMesh.position.x = 0; // Centrada en X
        innerMesh.position.z = zPosition; // Varía en Z
        innerMesh.userData.targetZ = zPosition; // Para animaciones futuras
        innerMesh.userData.currentSymbol = symbol;
        group.add(innerMesh);
        
        // Guardar referencia a la pieza móvil para animaciones
        group.userData.innerMesh = innerMesh;

        // Texto del símbolo - visible desde arriba
        const textPlane = this.createTextSprite(symbol, isHeadPosition);
        textPlane.position.y = frameThickness / 2 + 0.15; // Encima del marco
        group.add(textPlane);

        // Calcular posición en la pista ovalada usando la posición visual
        const pos = this.getCellPosition(visualPosition, totalCells);
        
        group.position.x = pos.x;
        group.position.y = pos.y - frameThickness / 2; // Bajar las celdas para que el fondo toque la correa
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
        // Grupo para el cabezal completo (cono + sensor infrarrojo)
        this.headGroup = new THREE.Group();
        
        // Crear cabezal lector/escritor (cono rojo)
        const coneGeometry = new THREE.ConeGeometry(0.3, 1.0, 4);
        const coneMaterial = new THREE.MeshStandardMaterial({
            color: 0xe74c3c, // Rojo
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0xe74c3c,
            emissiveIntensity: 0.3
        });
        const coneMesh = new THREE.Mesh(coneGeometry, coneMaterial);
        coneMesh.rotation.x = Math.PI; // Rotar 180 grados en X para que apunte hacia abajo
        this.headGroup.add(coneMesh);
        
        // Crear haz infrarrojo (línea/cilindro delgado)
        const beamLength = 0.8;
        const beamGeometry = new THREE.CylinderGeometry(0.02, 0.04, beamLength, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000, // Rojo brillante
            transparent: true,
            opacity: 0.6,
            emissive: 0xff0000,
            emissiveIntensity: 1.0
        });
        const beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);
        beamMesh.position.y = -0.5 - beamLength / 2; // Debajo del cono
        this.headGroup.add(beamMesh);
        
        // Guardar referencia al haz para posibles animaciones
        this.headGroup.userData.infraredBeam = beamMesh;
        
        // Posicionar el cabezal
        this.headMesh = this.headGroup; // Mantener compatibilidad con código existente
        this.updateHeadPosition();
        
        this.scene.add(this.headGroup);
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
        
        // Animar piezas móviles de las celdas
        this.animateMovingPieces();
    }
    
    /**
     * Anima suavemente las piezas móviles de las celdas hacia su posición objetivo
     */
    animateMovingPieces() {
        if (!this.tapeGroup) return;
        
        const lerpSpeed = 0.15; // Velocidad de interpolación (0-1, mayor = más rápido)
        
        this.tapeGroup.children.forEach(cellGroup => {
            if (!cellGroup.userData.innerMesh) return;
            
            const innerMesh = cellGroup.userData.innerMesh;
            const targetZ = innerMesh.userData.targetZ;
            
            // Interpolación suave (lerp) hacia la posición objetivo en Z
            if (Math.abs(innerMesh.position.z - targetZ) > 0.001) {
                innerMesh.position.z += (targetZ - innerMesh.position.z) * lerpSpeed;
            } else {
                innerMesh.position.z = targetZ; // Snap final para evitar oscilaciones
            }
        });
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
