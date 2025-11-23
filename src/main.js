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

        // Cámara - vista cenital (desde arriba) para ver los símbolos
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 8, 25); // Vista desde el frente
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

        // Grid helper - más grande para la cinta de 64 celdas
        const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize());
    }

    initTuringMachine() {
        // Inicializar máquina de Turing con una cinta de 64 celdas
        // Formato: número binario seguido de espacios en blanco
        // Ejemplo: 101 seguido de 61 guiones bajos
        const initialTape = ['1', '0', '1'];
        // Agregar 61 espacios en blanco para completar 64 celdas
        for (let i = 0; i < 61; i++) {
            initialTape.push('_');
        }
        
        this.turingMachine = new TuringMachine(initialTape, 'SUMA');
        
        // Renderizador visual de la máquina
        this.turingRenderer = new TuringRenderer(this.scene, this.turingMachine);
    }

    initControls() {
        this.isRunning = false;
        this.animationSpeed = 500; // milisegundos por paso
        
        // Botones de control
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.stepBtn = document.getElementById('stepBtn');
        
        // Botones de módulo
        this.moduleSumaBtn = document.getElementById('moduleSumaBtn');
        this.moduleRestaBtn = document.getElementById('moduleRestaBtn');
        
        // Input de cinta
        this.tapeInput = document.getElementById('tapeInput');
        this.loadTapeBtn = document.getElementById('loadTapeBtn');
        
        // Displays
        this.currentModuleDisplay = document.getElementById('currentModule');
        this.currentStateDisplay = document.getElementById('currentState');
        this.currentSymbolDisplay = document.getElementById('currentSymbol');
        this.stepCountDisplay = document.getElementById('stepCount');
        this.tapeVisualization = document.getElementById('tapeVisualization');
        this.resultOutput = document.getElementById('resultOutput');
        
        // Valor por defecto del input
        this.tapeInput.value = '101';
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.stepBtn.addEventListener('click', () => this.step());
        
        // Eventos para cambiar de módulo
        this.moduleSumaBtn.addEventListener('click', () => this.changeModule('SUMA'));
        this.moduleRestaBtn.addEventListener('click', () => this.changeModule('RESTA'));
        
        // Evento para cargar cinta personalizada
        this.loadTapeBtn.addEventListener('click', () => this.loadCustomTape());
        
        // Enter en el input también carga la cinta
        this.tapeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadCustomTape();
            }
        });
        
        // Validar que solo se ingresen 0s y 1s
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
        this.turingMachine.reset();
        // Forzar recreación de la cinta en reset
        if (this.turingRenderer) {
            this.turingRenderer.update(true);
        }
        this.resultOutput.textContent = 'Esperando...';
        this.resultOutput.style.background = 'rgba(255, 255, 255, 0.2)';
        this.updateDisplay();
    }

    step() {
        if (!this.turingMachine.isHalted()) {
            // Leer el símbolo detectado por el sensor
            const sensorData = this.turingRenderer.readSensors();
            // Pasar el símbolo detectado al método step de la máquina de Turing
            this.turingMachine.step(sensorData.symbol);
            // Forzar recreación de la cinta solo cuando cambia el estado
            if (this.turingRenderer) {
                this.turingRenderer.update(true);
            }
            this.updateDisplay();
        } else {
            // Si ya está detenida, mostrar mensaje
            console.log('✅ Máquina detenida. Resultado:', this.resultOutput.textContent);
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
        this.currentModuleDisplay.textContent = this.turingMachine.getModuleName();
        this.currentStateDisplay.textContent = this.turingMachine.currentState;
        this.currentSymbolDisplay.textContent = this.turingMachine.getCurrentSymbol();
        this.stepCountDisplay.textContent = this.turingMachine.stepCount;
        
        // Actualizar visualización de cinta
        this.updateTapeVisualization();
        
        // Actualizar resultado si la máquina se detuvo
        if (this.turingMachine.isHalted()) {
            this.updateResult();
        }
    }

    updateTapeVisualization() {
        // Obtener la cinta completa sin espacios en blanco del final
        let tape = [...this.turingMachine.tape];
        
        // Eliminar guiones bajos del final
        while (tape.length > 0 && tape[tape.length - 1] === '_') {
            tape.pop();
        }
        
        // Si quedó vacía, mostrar al menos un guión bajo
        if (tape.length === 0) {
            tape = ['_'];
        }
        
        // Crear visualización con el cabezal marcado
        let visualization = '';
        for (let i = 0; i < tape.length; i++) {
            if (i === this.turingMachine.headPosition) {
                // Marcar posición del cabezal con corchetes y color
                visualization += `<span style="color: #e74c3c; font-size: 22px;">[${tape[i]}]</span>`;
            } else {
                visualization += tape[i];
            }
            
            // Agregar espacio entre símbolos
            if (i < tape.length - 1) {
                visualization += ' ';
            }
        }
        
        this.tapeVisualization.innerHTML = visualization;
    }

    updateResult() {
        // Extraer el resultado de la cinta (sin espacios en blanco)
        const result = this.turingMachine.tape
            .filter(symbol => symbol !== '_')
            .join('');
        
        if (result === '') {
            this.resultOutput.textContent = '0';
            this.resultOutput.style.background = 'rgba(255, 255, 255, 0.2)';
        } else {
            // Convertir binario a decimal para mostrar
            const decimal = parseInt(result, 2);
            this.resultOutput.textContent = `${result} (${decimal} en decimal)`;
            this.resultOutput.style.background = 'rgba(46, 204, 113, 0.3)';
        }
    }

    loadCustomTape() {
        // Pausar ejecución si está corriendo
        this.pause();
        
        // Obtener valor del input
        const inputValue = this.tapeInput.value.trim();
        
        // Validar que no esté vacío
        if (inputValue === '') {
            alert('⚠️ Por favor ingresa un número binario');
            return;
        }
        
        // Validar que solo contenga 0s y 1s
        if (!/^[01]+$/.test(inputValue)) {
            alert('⚠️ Solo se permiten números binarios (0 y 1)');
            return;
        }
        
        // Crear la cinta con el input + 64 celdas totales
        const newTape = [...inputValue.split('')];
        const remainingCells = 64 - newTape.length;
        for (let i = 0; i < remainingCells; i++) {
            newTape.push('_');
        }
        
        // Obtener módulo actual
        const currentModule = this.turingMachine.currentModule;
        
        // Reiniciar máquina con nueva cinta
        this.turingMachine = new TuringMachine(newTape, currentModule);
        this.turingRenderer.updateMachine(this.turingMachine);
        
        // Resetear resultado
        this.resultOutput.textContent = 'Esperando...';
        this.resultOutput.style.background = 'rgba(255, 255, 255, 0.2)';
        
        this.updateDisplay();
        
        console.log(`✅ Cinta cargada: ${inputValue}`);
    }

    changeModule(moduleName) {
        // Pausar ejecución si está corriendo
        this.pause();
        
        // Cambiar módulo con efecto visual
        this.animateModuleChange(moduleName);
        
        // Actualizar botones activos
        if (moduleName === 'SUMA') {
            this.moduleSumaBtn.classList.add('active');
            this.moduleRestaBtn.classList.remove('active');
        } else {
            this.moduleRestaBtn.classList.add('active');
            this.moduleSumaBtn.classList.remove('active');
        }
        
        // Usar el valor del input si existe, sino usar valor por defecto
        const inputValue = this.tapeInput.value.trim() || '101';
        const newTape = [...inputValue.split('')];
        const remainingCells = 64 - newTape.length;
        for (let i = 0; i < remainingCells; i++) {
            newTape.push('_');
        }
        
        // Reiniciar máquina con nuevo módulo
        this.turingMachine = new TuringMachine(newTape, moduleName);
        this.turingRenderer.updateMachine(this.turingMachine);
        this.updateDisplay();
    }

    animateModuleChange(moduleName) {
        // Animación simple del cabezal para simular cambio físico
        if (this.turingRenderer.headMesh) {
            const originalY = this.turingRenderer.headMesh.position.y;
            
            // Subir el cabezal
            this.turingRenderer.headMesh.position.y = originalY + 3;
            
            // Cambiar color según módulo
            setTimeout(() => {
                if (moduleName === 'SUMA') {
                    this.turingRenderer.headMesh.material.color.setHex(0x2ecc71); // Verde
                    this.turingRenderer.headMesh.material.emissive.setHex(0x2ecc71);
                } else {
                    this.turingRenderer.headMesh.material.color.setHex(0xe74c3c); // Rojo
                    this.turingRenderer.headMesh.material.emissive.setHex(0xe74c3c);
                }
                
                // Bajar el cabezal
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
        
        // Actualizar el renderer de Turing (incluye lectura de sensores)
        if (this.turingRenderer) {
            this.turingRenderer.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Iniciar aplicación cuando el DOM esté listo
new App();
