# Simulador de Máquina de Turing 3D

Visualización interactiva de una Máquina de Turing usando Three.js y Vite.

## Características

- 🎮 Visualización 3D de la cinta y cabezal de la máquina
- ⚡ Ejecución paso a paso o automática
- 🎨 Interfaz moderna y responsive
- 🔄 Controles intuitivos (Iniciar, Pausar, Reiniciar, Paso a Paso)
- 📊 Información en tiempo real del estado de la máquina

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor de desarrollo se abrirá en `http://localhost:3000`

## Build

```bash
npm run build
```

## Estructura del Proyecto

```
MaquinaTuring/
├── src/
│   ├── main.js           # Punto de entrada y configuración de Three.js
│   ├── TuringMachine.js  # Lógica de la máquina de Turing
│   └── TuringRenderer.js # Renderizado 3D de la máquina
├── index.html            # HTML principal
├── style.css             # Estilos
├── vite.config.js        # Configuración de Vite
└── package.json          # Dependencias
```

## Personalización

### Modificar la tabla de transiciones

Edita el método `defineTransitions()` en `src/TuringMachine.js`:

```javascript
defineTransitions() {
    return {
        'estado,símbolo': ['nuevoEstado', 'nuevoSímbolo', 'dirección'],
        // ... más transiciones
    };
}
```

### Cambiar la cinta inicial

Modifica el array en `src/main.js`:

```javascript
const initialTape = ['1', '0', '1', '1', '0', '_', '_', '_'];
```

## Tecnologías

- **Three.js** - Librería 3D
- **Vite** - Build tool y dev server
- **JavaScript ES6+** - Lenguaje
