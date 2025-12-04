# Simulación Digital de Máquina de Turing: Operaciones Aritméticas

**Asignatura:** Fundamentos de la Computación
**Profesor:** José Luis Veas Muñoz
**Integrantes:**
* Andrés Hidalgo Ramallo, RUT: 21.795.550-5
* Catalina Araya Avila, RUT: 21.791.560-0

Este proyecto consiste en una implementación visual de una Máquina de Turing desarrollada con tecnologías web modernas (**Three.js** y **Vite**). El software simula la lógica de autómatas finitos para realizar operaciones aritméticas, visualizando el movimiento del cabezal y la modificación de la cinta en un entorno 3D.

-----
## Descripción del Proyecto

El objetivo principal es demostrar la ejecución visual de algoritmos computacionales primitivos. El sistema cuenta con una arquitectura modular que permite realizar dos operaciones básicas sobre la cinta:

1.  **Módulo de Suma:** Algoritmo de adición lógica.
2.  **Módulo de Resta:** Algoritmo de sustracción y retroceso.

## Requisitos Previos

  * **Node.js** (Versión 14.0.0 o superior).
  * **NPM** (Gestor de paquetes de Node).

## Instalación y Despliegue

1.  **Instalar dependencias:**
    Descarga el proyecto y ejecuta en la terminal:

    ```bash
    npm install
    ```

2.  **Ejecutar servidor de desarrollo:**
    Inicia el entorno local con Vite:

    ```bash
    npm run dev
    ```

3.  **Visualizar:**
    Accede a la URL indicada en la terminal (usualmente `http://localhost:5173` o `http://localhost:3000`).

-----

## Manual de Uso

1.  **Selección del Módulo:**
    Utilice el panel superior para alternar entre la lógica de **SUMA** y **RESTA**.

2.  **Entrada de Datos:**

      * La máquina opera procesando símbolos en la cinta.
      * Ingrese la cadena de datos inicial (ej: `11101`) en el campo de texto.
      * Presione el botón **"Cargar Cinta"** para inicializar el entorno 3D.

3.  **Ejecución:**

      * Utilice los controles de reproducción (Play/Pausa/Paso a Paso) para observar el comportamiento del autómata.
      * La ejecución termina cuando la máquina alcanza el estado `qFIN`.

-----

## Documentación Técnica: Tablas de Transición

A continuación se detallan las reglas de transición exactas implementadas en el código (`TuringMachine.js`), extraídas de la lógica de diseño.

**Convenciones:**

  * **R:** Mover a la derecha (Right).
  * **L:** Mover a la izquierda (Left).
  * **S:** Mantener posición (Stay).
  * **-:** Símbolo vacío (Blank).

### 1\. Módulo SUMA

Lógica diseñada para procesar la adición y el cambio de estado mediante la detección de ceros y unos.

| Estado Actual | Símbolo Leído | Escribe | Nuevo Estado | Movimiento |
| :--- | :---: | :---: | :--- | :---: |
| **q0** | 1 | 1 | **q0** | R |
| **q0** | 0 | 1 | **q1** | R |
| **q0** | - | - | **qFIN** | S |
| **q1** | 1 | 1 | **q1** | R |
| **q1** | - | - | **q2** | L |
| **q2** | 1 | - | **qFIN** | S |

### 2\. Módulo RESTA

Algoritmo complejo que incluye búsqueda del final de la cadena, retroceso y borrado lógico.

| Estado Actual | Símbolo Leído | Escribe | Nuevo Estado | Movimiento |
| :--- | :---: | :---: | :--- | :---: |
| **q0** | 1 | 1 | **q0** | R |
| **q0** | 0 | 0 | **q1** | R |
| **q0** | - | - | **qFIN** | S |
| **q1** | 1 | 1 | **q1** | R |
| **q1** | 0 | 0 | **q1** | R |
| **q1** | - | - | **q2** | L |
| **q2** | 1 | - | **q3** | L |
| **q2** | 0 | 0 | **qFIN** | S |
| **q2** | - | - | **q2** | L |
| **q3** | 1 | 1 | **q3** | L |
| **q3** | 0 | 0 | **q3** | L |
| **q3** | - | - | **q4** | R |
| **q4** | 1 | - | **q0** | R |
| **q4** | - | - | **q4** | R |

-----

## Estructura del Proyecto

La organización de archivos sigue el estándar de proyectos Vite + Three.js:

```text
MAQUINATURING/
├── public/                # Assets estáticos
├── src/
│   ├── TuringMachine.js   # Lógica matemática y reglas de transición
│   ├── TuringRenderer.js  # Motor gráfico (Three.js), manejo de cinta y cabezal
│   └── main.js            # Punto de entrada y orquestación
├── DIARIO_PROYECTO.md     # Registro de avances y decisiones
├── HARDWARE.md            # Documentación del prototipo físico descartado
├── README.md              # Documentación general (Este archivo)
├── index.html             # Interfaz de usuario (Canvas y UI)
├── package.json           # Configuración de scripts y dependencias
├── style.css              # Estilos globales
└── vite.config.js         # Configuración del empaquetador Vite
```
