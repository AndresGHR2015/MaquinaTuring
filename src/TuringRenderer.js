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
        this.cellSize = 1.5;
        this.visibleCells = 10;
        
        this.scene.add(this.tapeGroup);
        this.createTape();
        this.createHead();
    }

    createTape() {
        // Limpiar cinta anterior
        this.tapeGroup.clear();

        const tape = this.turingMachine.tape;
        const headPos = this.turingMachine.headPosition;
        
        // Calcular rango visible centrado en el cabezal
        const start = Math.max(0, headPos - Math.floor(this.visibleCells / 2));
        const end = Math.min(tape.length, start + this.visibleCells);

        for (let i = start; i < end; i++) {
            const cell = this.createCell(tape[i], i - headPos);
            this.tapeGroup.add(cell);
        }
    }

    createCell(symbol, relativePosition) {
        const group = new THREE.Group();
        
        // Cubo de la celda
        const geometry = new THREE.BoxGeometry(this.cellSize, this.cellSize, 0.3);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            metalness: 0.3,
            roughness: 0.7
        });
        const cube = new THREE.Mesh(geometry, material);
        group.add(cube);

        // Borde de la celda
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x3498db, linewidth: 2 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        group.add(wireframe);

        // Texto del símbolo (usando sprites por simplicidad)
        const sprite = this.createTextSprite(symbol);
        sprite.position.z = 0.2;
        group.add(sprite);

        // Posicionar celda
        group.position.x = relativePosition * this.cellSize;
        
        return group;
    }

    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        
        context.fillStyle = '#ffffff';
        context.font = 'Bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1, 1, 1);
        
        return sprite;
    }

    createHead() {
        // Crear cabezal lector/escritor
        const geometry = new THREE.ConeGeometry(0.5, 1.5, 4);
        const material = new THREE.MeshStandardMaterial({
            color: 0xe74c3c,
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0xe74c3c,
            emissiveIntensity: 0.3
        });
        this.headMesh = new THREE.Mesh(geometry, material);
        this.headMesh.rotation.x = Math.PI; // Apuntar hacia abajo
        this.headMesh.position.set(0, 2, 0);
        
        this.scene.add(this.headMesh);
    }

    update() {
        // Actualizar visualización de la cinta
        this.createTape();
        
        // Animar cabezal (pequeño movimiento)
        if (this.headMesh) {
            this.headMesh.position.y = 2 + Math.sin(Date.now() * 0.003) * 0.1;
        }
    }

    updateMachine(newTuringMachine) {
        // Actualizar referencia a la nueva máquina
        this.turingMachine = newTuringMachine;
        this.createTape();
    }

    animateStep() {
        // Animación suave cuando se mueve el cabezal (opcional)
        // Se puede implementar con GSAP o tweening manual
    }
}
