/**
 * Clase que representa la lógica de una Máquina de Turing
 * Soporta dos módulos intercambiables: SUMA y RESTA (números binarios)
 */
export class TuringMachine {
    constructor(initialTape = ['_'], module = 'SUMA') {
        this.tape = [...initialTape];
        this.headPosition = 0;
        this.currentState = 'q0';
        this.haltState = 'qFIN'; // Estado de halt actualizado
        this.stepCount = 0;
        this.currentModule = module; // 'SUMA' o 'RESTA'
        
        // Guardar estado inicial para reset
        this.initialTape = [...initialTape];
        this.initialState = 'q0';
        this.initialModule = module;
        
        // Definir tabla de transiciones según el módulo
        this.transitions = this.defineTransitions();
    }

    defineTransitions() {
        if (this.currentModule === 'SUMA') {
            return this.moduloSuma();
        } else if (this.currentModule === 'RESTA') {
            return this.moduloResta();
        }
    }

    /**
     * MÓDULO DE SUMA - Incrementa en 1 un número binario (operación unaria)
     * Entrada: un número binario seguido de '_'
     * Ejemplo 1: 101_ (5 + 1 = 6 en decimal = 110 en binario)
     * 
     * Tabla de transiciones:
     * q0,1 -> q0,1,R
     * q0,0 -> q1,1,R
     * q0,_ -> qFIN,_,S
     * q1,1 -> q1,1,R
     * q1,_ -> q2,_,L
     * q2,1 -> qFIN,_,S
     */
    moduloSuma() {
        return {
            // Estado q0
            'q0,1': ['q0', '1', 'R'],
            'q0,0': ['q1', '1', 'R'],
            'q0,_': ['qFIN', '_', 'N'], // S = Stay (N = No move)
            
            // Estado q1
            'q1,1': ['q1', '1', 'R'],
            'q1,_': ['q2', '_', 'L'],
            
            // Estado q2
            'q2,1': ['qFIN', '_', 'N'], // S = Stay
        };
    }

    /**
     * MÓDULO DE RESTA - Decrementa en 1 un número binario (operación unaria)
     * Entrada: un número binario seguido de '_'
     * Ejemplo: 101_ (5 - 1 = 4 en decimal = 100 en binario)
     * 
     * Tabla de transiciones:
     * q0,1 -> q0,1,R
     * q0,0 -> q0,0,R
     * q0,_ -> q1,_,L
     * q1,1 -> q2,_,L
     * q1,0 -> qFIN,_,S
     * q1,_ -> q3,_,L
     * q2,1 -> q2,1,L
     * q2,0 -> q2,0,L
     * q2,_ -> q3,_,R
     * q3,1 -> q0,_,R
     */
    moduloResta() {
        return {
            // Estado q0
            'q0,1': ['q0', '1', 'R'],
            'q0,0': ['q1', '0', 'R'],
            'q0,_': ['qFIN', '_', 'N'],
            
            // Estado q1
            'q1,1': ['q1', '1', 'R'],
            'q1,0': ['q1', '0', 'R'], // S = Stay
            'q1,_': ['q2', '_', 'L'],
            
            // Estado q2
            'q2,1': ['q3', '_', 'L'],
            'q2,0': ['qFIN', '_', 'N'],
            'q2,_': ['q4', '_', 'L'],
            
            // Estado q3
            'q3,1': ['q3', '1', 'L'],
            'q3,0': ['q3', '0', 'L'],
            'q3,_': ['q4', '_', 'R'], // S = Stay

            'q4,1': ['q0', '_', 'R']
        };
    }

    /**
     * Cambiar el módulo de operación (simula cambio físico de cabezal)
     */
    changeModule(newModule) {
        this.currentModule = newModule;
        this.initialModule = newModule;
        this.transitions = this.defineTransitions();
    }

    getCurrentSymbol() {
        return this.tape[this.headPosition] || '_';
    }

    step() {
        if (this.isHalted()) {
            return false;
        }

        // Usar únicamente el símbolo recibido por el sensor
        const currentSymbol = arguments[0];
        const key = `${this.currentState},${currentSymbol}`;
        const transition = this.transitions[key];

        if (!transition) {
            console.warn(`No hay transición definida para ${key}`);
            this.currentState = this.haltState;
            return false;
        }

        const [newState, newSymbol, direction] = transition;

        // Escribir nuevo símbolo
        this.tape[this.headPosition] = newSymbol;

        // Cambiar estado
        this.currentState = newState;

        // Mover cabezal
        if (direction === 'R') {
            this.headPosition++;
            // Expandir cinta si es necesario
            if (this.headPosition >= this.tape.length) {
                this.tape.push('_');
            }
        } else if (direction === 'L') {
            this.headPosition--;
            // Expandir cinta a la izquierda si es necesario
            if (this.headPosition < 0) {
                this.tape.unshift('_');
                this.headPosition = 0;
            }
        }
        // 'N' = no moverse

        this.stepCount++;
        return true;
    }

    isHalted() {
        return this.currentState === this.haltState;
    }

    reset() {
        this.tape = [...this.initialTape];
        this.headPosition = 0;
        this.currentState = this.initialState;
        this.stepCount = 0;
        this.currentModule = this.initialModule;
        this.transitions = this.defineTransitions();
    }

    getTapeSegment(start, end) {
        return this.tape.slice(start, end);
    }

    getModuleName() {
        return this.currentModule;
    }
}
