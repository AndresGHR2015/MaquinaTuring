/**
 * Clase que representa la lógica de una Máquina de Turing
 */
export class TuringMachine {
    constructor(initialTape = ['_']) {
        this.tape = [...initialTape];
        this.headPosition = 0;
        this.currentState = 'q0';
        this.haltState = 'qH';
        this.stepCount = 0;
        
        // Guardar estado inicial para reset
        this.initialTape = [...initialTape];
        this.initialState = 'q0';
        
        // Definir tabla de transiciones
        // Formato: { 'estado,símbolo': ['nuevoEstado', 'nuevoSímbolo', 'dirección'] }
        this.transitions = this.defineTransitions();
    }

    defineTransitions() {
        // Ejemplo: Máquina que invierte bits (0 -> 1, 1 -> 0)
        return {
            'q0,0': ['q0', '1', 'R'],
            'q0,1': ['q0', '0', 'R'],
            'q0,_': ['qH', '_', 'N'], // Halt cuando encuentra espacio vacío
        };
    }

    getCurrentSymbol() {
        return this.tape[this.headPosition] || '_';
    }

    step() {
        if (this.isHalted()) {
            return false;
        }

        const currentSymbol = this.getCurrentSymbol();
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
    }

    getTapeSegment(start, end) {
        return this.tape.slice(start, end);
    }
}
