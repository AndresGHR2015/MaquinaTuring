# Simulador de Máquina de Turing 3D - Calculadora Binaria

Visualización interactiva de una Máquina de Turing con **módulos intercambiables** (SUMA y RESTA) usando Three.js y Vite.

## 🎯 Características

- 🎮 **Visualización 3D** de la cinta y cabezal de la máquina
- 🔧 **2 Módulos Intercambiables**:
  - ➕ **SUMA**: Suma de números binarios
  - ➖ **RESTA**: Resta de números binarios
- ⚡ Ejecución paso a paso o automática
- 🎨 Interfaz moderna y responsive
- 🔄 Controles intuitivos (Iniciar, Pausar, Reiniciar, Paso a Paso)
- 📊 Información en tiempo real del estado de la máquina
- 🎬 Animación de cambio de módulo (simula cambio físico del cabezal)

## 📦 Instalación

```bash
npm install
```

## 🚀 Desarrollo

```bash
npm run dev
```

El servidor de desarrollo se abrirá en `http://localhost:3000`

## 🏗️ Build

```bash
npm run build
```

## 🎮 Uso

### Módulo SUMA (Operación Unaria: +1)
- **Entrada**: Un número binario seguido de `_`
- **Ejemplo**: `101_` (5 + 1 = 6 en decimal = 110 en binario)
- **Resultado**: La máquina incrementa el número en 1

### Módulo RESTA (Operación Unaria: -1)
- **Entrada**: Un número binario seguido de `_`
- **Ejemplo**: `101_` (5 - 1 = 4 en decimal = 100 en binario)
- **Resultado**: La máquina decrementa el número en 1

### Cambiar entre módulos
1. Haz clic en **➕ SUMA** o **➖ RESTA**
2. El cabezal cambiará de color (verde para suma, rojo para resta)
3. La cinta se reiniciará con un ejemplo: `101_`
4. Ambos módulos usan el mismo formato de entrada, pero realizan operaciones diferentes

## 🎓 Tablas de Transición

### SUMA (Ejemplo: 5 + 1)
| Estado | Lee | Escribe | Nuevo Estado | Mover |
|--------|-----|---------|--------------|-------|
| q0     | 1   | 1       | q0           | R     |
| q0     | 0   | 1       | q1           | R     |
| q0     | _   | _       | qFIN         | S     |
| q1     | 1   | 1       | q1           | R     |
| q1     | _   | _       | q2           | L     |
| q2     | 1   | _       | qFIN         | S     |

### RESTA
| Estado | Lee | Escribe | Nuevo Estado | Mover |
|--------|-----|---------|--------------|-------|
| q0     | 1   | 1       | q0           | R     |
| q0     | 0   | 0       | q0           | R     |
| q0     | _   | _       | q1           | L     |
| q1     | 1   | _       | q2           | L     |
| q1     | 0   | _       | qFIN         | S     |
| q1     | _   | _       | q3           | L     |
| q2     | 1   | 1       | q2           | L     |
| q2     | 0   | 0       | q2           | L     |
| q2     | _   | _       | q3           | R     |
| q3     | 1   | _       | q0           | R     |

## 📁 Estructura del Proyecto

```
MaquinaTuring/
├── src/
│   ├── main.js           # Punto de entrada y configuración de Three.js
│   ├── TuringMachine.js  # Lógica de los autómatas (SUMA y RESTA)
│   └── TuringRenderer.js # Renderizado 3D de la máquina
├── index.html            # HTML principal con controles
├── style.css             # Estilos
├── vite.config.js        # Configuración de Vite
└── package.json          # Dependencias
```

## 🔧 Personalización

### Modificar la cinta inicial

Edita en `src/main.js` el método `changeModule()`:

```javascript
if (moduleName === 'SUMA') {
    newTape = ['1', '1', '1', '_', '_', '_', '_']; // 7 + 1 = 8
}
```

### Ajustar velocidad de ejecución

Modifica en `src/main.js`:

```javascript
this.animationSpeed = 500; // milisegundos por paso (más bajo = más rápido)
```

## 🎓 Concepto

Este proyecto simula una **Máquina de Turing con módulos intercambiables**, replicando el concepto de una máquina análoga donde se puede cambiar físicamente el cabezal lector/escritor para realizar diferentes operaciones. El cambio de módulo incluye una animación visual que representa este intercambio físico.

Las operaciones son **unarias**:
- **SUMA**: Incrementa el número binario en 1
- **RESTA**: Decrementa el número binario en 1

## 🛠️ Tecnologías

- **Three.js** - Librería 3D para WebGL
- **Vite** - Build tool y dev server ultrarrápido
- **JavaScript ES6+** - Lenguaje moderno
- **CSS3** - Estilos y animaciones
