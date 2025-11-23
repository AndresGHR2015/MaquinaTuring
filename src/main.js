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
            60,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 8, 25);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Controles
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Iluminación
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);

        // Grid
        const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    initTuringMachine() {
        const initialTape = Array(64).fill('_');
        this.turingMachine = new TuringMachine(initialTape, 'SUMA');
        this.turingRenderer = new TuringRenderer(this.scene, this.turingMachine);
    }

    initControls() {
        this.isRunning = false;
        this.isProcessingStep = false; // Flag para evitar solapamiento de animaciones
        this.animationSpeed = 100; // Tiempo de espera ENTRE pasos (no incluye la duración de la animación)
        
        // Botones
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.stepBtn = document.getElementById('stepBtn');
        
        this.moduleSumaBtn = document.getElementById('moduleSumaBtn');
        this.moduleRestaBtn = document.getElementById('moduleRestaBtn');
        
        this.tapeInput = document.getElementById('tapeInput');
        this.loadTapeBtn = document.getElementById('loadTapeBtn');
        
        // Displays
        this.currentModuleDisplay = document.getElementById('currentModule');
        this.currentStateDisplay = document.getElementById('currentState');
        this.currentSymbolDisplay = document.getElementById('currentSymbol');
        this.stepCountDisplay = document.getElementById('stepCount');
        this.tapeVisualization = document.getElementById('tapeVisualization');
        this.resultOutput = document.getElementById('resultOutput');
        
        this.tapeInput.value = '';
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.stepBtn.addEventListener('click', () => this.step());
        
        this.moduleSumaBtn.addEventListener('click', () => this.changeModule('SUMA'));
        this.moduleRestaBtn.addEventListener('click', () => this.changeModule('RESTA'));
        
        this.loadTapeBtn.addEventListener('click', () => this.loadCustomTape());
        this.tapeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadCustomTape();
        });
        
        this.tapeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^01]/g, '');
        });
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
        this.isProcessingStep = false;
        this.turingMachine.reset();
        
        if (this.turingRenderer) {
            this.turingRenderer.update(true);
        }
        
        this.resultOutput.textContent = 'Esperando...';
        this.resultOutput.style.background = 'rgba(255, 255, 255, 0.2)';
        this.updateDisplay();
    }

    // --- LÓGICA PRINCIPAL DEL PASO ---
    step() {
        // 1. Validaciones previas
        if (this.turingMachine.isHalted()) {
            console.log('✅ Máquina detenida. Resultado:', this.resultOutput.textContent);
            this.isRunning = false; // Detener auto-run si termina
            return;
        }

        // Si ya estamos animando un paso, no hacer nada (evita bugs visuales)
        if (this.isProcessingStep) return;
        this.isProcessingStep = true;

        // 2. Leer Sensores (Raycasting 3D)
        const sensorData = this.turingRenderer.readSensors();
        
        // 3. Ejecutar Lógica (Obtenemos qué hacer, pero la memoria interna ya cambió)
        const result = this.turingMachine.step(sensorData.symbol);

        if (result.status === 'HALTED') {
            this.isProcessingStep = false;
            this.updateDisplay();
            return;
        }

        // Función auxiliar para finalizar el paso y preparar el siguiente
        const finalizeStep = () => {
            this.updateDisplay();
            this.isProcessingStep = false;

            // Si estamos en modo automático, programar el siguiente paso
            if (this.isRunning) {
                setTimeout(() => this.run(), this.animationSpeed);
            }
        };

        // 4. Coordinar Animaciones
        if (result.action === 'WRITE_AND_MOVE') {
            // CASO A: Escribir y luego mover
            
            // Llamamos a la animación del brazo
            this.turingRenderer.animateWriteOperation(
                result.newSymbol,
                
                // Callback 1: ¡MOMENTO DEL GOLPE!
                (symbol) => {
                    // Aquí actualizamos la cinta 3D. Como this.turingMachine.tape ya tiene
                    // el nuevo dato, update(true) recreará la cinta con el símbolo nuevo.
                    // Visualmente parecerá que el dedo lo cambió.
                    this.turingRenderer.update(true);
                },

                // Callback 2: Animación terminada (brazo retraído)
                () => {
                    finalizeStep();
                }
            );

        } else {
            // CASO B: Solo mover (sin escritura o mismo símbolo)
            
            // Actualizamos la cinta inmediatamente (el renderer detectará el movimiento del cabezal y hará scroll)
            this.turingRenderer.update(true);
            
            // Pequeña pausa para que se vea el movimiento antes del siguiente
            setTimeout(finalizeStep, 100);
        }
    }

    run() {
        // Solo llamamos a step(). step() se encargará de volver a llamar a run()
        // cuando termine la animación actual, creando un bucle asíncrono seguro.
        if (this.isRunning) {
            this.step();
        }
    }

    updateDisplay() {
        this.currentModuleDisplay.textContent = this.turingMachine.getModuleName();
        this.currentStateDisplay.textContent = this.turingMachine.currentState;
        const symbol = this.turingMachine.tape[this.turingMachine.headPosition] || '_';
        this.currentSymbolDisplay.textContent = symbol;
        this.stepCountDisplay.textContent = this.turingMachine.stepCount;
        
        this.updateTapeVisualization();
        
        if (this.turingMachine.isHalted()) {
            this.updateResult();
        }
    }

    updateTapeVisualization() {
        // (Lógica de visualización HTML - Sin cambios)
        let tape = [...this.turingMachine.tape];
        let firstNonBlank = 0;
        let lastNonBlank = tape.length - 1;
        
        for (let i = 0; i < tape.length; i++) {
            if (tape[i] !== '_') { firstNonBlank = i; break; }
        }
        for (let i = tape.length - 1; i >= 0; i--) {
            if (tape[i] !== '_') { lastNonBlank = i; break; }
        }
        
        let visibleTape = tape.slice(firstNonBlank, lastNonBlank + 1).filter(s => s !== '_');
        if (visibleTape.length === 0) visibleTape = ['_'];

        let headPos = this.turingMachine.headPosition - firstNonBlank;
        if (headPos < 0 || headPos >= visibleTape.length) headPos = -1;

        let visualization = '';
        for (let i = 0; i < visibleTape.length; i++) {
            if (i === headPos) {
                visualization += `<span style="color: #e74c3c; font-size: 22px;">[${visibleTape[i]}]</span>`;
            } else {
                visualization += visibleTape[i];
            }
            if (i < visibleTape.length - 1) visualization += ' ';
        }
        this.tapeVisualization.innerHTML = visualization;
    }

    updateResult() {
        // (Lógica de resultado - Sin cambios)
        let tape = [...this.turingMachine.tape];
        let firstNonBlank = 0;
        let lastNonBlank = tape.length - 1;
        for (let i = 0; i < tape.length; i++) {
            if (tape[i] !== '_') { firstNonBlank = i; break; }
        }
        for (let i = tape.length - 1; i >= 0; i--) {
            if (tape[i] !== '_') { lastNonBlank = i; break; }
        }
        const result = tape.slice(firstNonBlank, lastNonBlank + 1).filter(symbol => symbol !== '_').join('');

        if (result === '') {
            this.resultOutput.textContent = '0';
            this.resultOutput.style.background = 'rgba(255, 255, 255, 0.2)';
        } else {
            const decimal = result.split('').filter(c => c === '1').length;
            this.resultOutput.textContent = `${result} (${decimal} en decimal)`;
            this.resultOutput.style.background = 'rgba(46, 204, 113, 0.3)';
        }
    }

    loadCustomTape() {
        this.pause();
        const inputValue = this.tapeInput.value.trim();
        
        if (inputValue === '') { alert('Por favor ingresa un número binario'); return; }
        if (!/^[01]+$/.test(inputValue)) { alert('Solo se permiten números binarios (0 y 1)'); return; }
        
        const newTape = [...inputValue.split('')];
        const remainingCells = 64 - newTape.length;
        for (let i = 0; i < remainingCells; i++) newTape.push('_');
        
        const currentModule = this.turingMachine.currentModule;
        
        this.turingMachine = new TuringMachine(newTape, currentModule);
        this.turingRenderer.updateMachine(this.turingMachine);
        
        this.resultOutput.textContent = 'Esperando...';
        this.resultOutput.style.background = 'rgba(255, 255, 255, 0.2)';
        
        this.updateDisplay();
        console.log(`✅ Cinta cargada: ${inputValue}`);
    }

    changeModule(moduleName) {
        this.pause();
        this.animateModuleChange(moduleName);
        
        if (moduleName === 'SUMA') {
            this.moduleSumaBtn.classList.add('active');
            this.moduleRestaBtn.classList.remove('active');
        } else {
            this.moduleRestaBtn.classList.add('active');
            this.moduleSumaBtn.classList.remove('active');
        }
        
        const inputValue = this.tapeInput.value.trim();
        const newTape = inputValue === '' ? Array(64).fill('_') : [...inputValue.split('')];
        const remainingCells = 64 - newTape.length;
        for (let i = 0; i < remainingCells; i++) newTape.push('_');
        
        this.turingMachine = new TuringMachine(newTape, moduleName);
        this.turingRenderer.updateMachine(this.turingMachine);
        this.updateDisplay();
    }

    animateModuleChange(moduleName) {
        if (this.turingRenderer.headMesh) {
            const originalY = this.turingRenderer.headMesh.position.y;
            this.turingRenderer.headMesh.position.y = originalY + 3;
            
            setTimeout(() => {
                if (moduleName === 'SUMA') {
                    this.turingRenderer.headMesh.material.color.setHex(0x2ecc71); 
                    this.turingRenderer.headMesh.material.emissive.setHex(0x2ecc71);
                } else {
                    this.turingRenderer.headMesh.material.color.setHex(0xe74c3c); 
                    this.turingRenderer.headMesh.material.emissive.setHex(0xe74c3c);
                }
                this.turingRenderer.headMesh.position.y = originalY;
            }, 300);
        }
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        if (this.turingRenderer) {
            this.turingRenderer.update();
        }
        this.renderer.render(this.scene, this.camera);
    }
}

new App();