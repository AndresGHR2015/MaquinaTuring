import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TuringMachine } from './TuringMachine';
import { TuringRenderer } from './TuringRenderer';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.initScene();
        this.initTuringMachine();
        this.initControls();
        this.setupEventListeners();
        this.animate();
    }

    initScene() {
        // Escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Cámara
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Controles de órbita
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Iluminación
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);

        // Grid helper
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize());
    }

    initTuringMachine() {
        // Inicializar máquina de Turing con una cinta de ejemplo
        const initialTape = ['1', '0', '1', '1', '0', '_', '_', '_'];
        this.turingMachine = new TuringMachine(initialTape);
        
        // Renderizador visual de la máquina
        this.turingRenderer = new TuringRenderer(this.scene, this.turingMachine);
    }

    initControls() {
        this.isRunning = false;
        this.animationSpeed = 500; // milisegundos por paso
        
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.stepBtn = document.getElementById('stepBtn');
        
        this.currentStateDisplay = document.getElementById('currentState');
        this.currentSymbolDisplay = document.getElementById('currentSymbol');
        this.stepCountDisplay = document.getElementById('stepCount');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.stepBtn.addEventListener('click', () => this.step());
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.run();
        }
    }

    pause() {
        this.isRunning = false;
    }

    reset() {
        this.isRunning = false;
        this.turingMachine.reset();
        this.turingRenderer.update();
        this.updateDisplay();
    }

    step() {
        if (!this.turingMachine.isHalted()) {
            this.turingMachine.step();
            this.turingRenderer.update();
            this.updateDisplay();
        }
    }

    run() {
        if (this.isRunning && !this.turingMachine.isHalted()) {
            this.step();
            setTimeout(() => this.run(), this.animationSpeed);
        } else {
            this.isRunning = false;
        }
    }

    updateDisplay() {
        this.currentStateDisplay.textContent = this.turingMachine.currentState;
        this.currentSymbolDisplay.textContent = this.turingMachine.getCurrentSymbol();
        this.stepCountDisplay.textContent = this.turingMachine.stepCount;
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Iniciar aplicación cuando el DOM esté listo
new App();
