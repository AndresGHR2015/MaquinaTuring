//esto se ve mejor en el formato de codigo, no se como arreglar las tablas para que se vean mejor 
# Simulación digital de maquina de Turing: operaciones aritmeticas ( con el sistema unario)

Este proyecto consiste en una implementación visual de una máquina de turing desarrollada con tecnologías web (Three.js y Vite).
El software simula la lógica de autómatas finitos para realizar operaciones de suma y resta utilizando el sistema numérico unario.

## Descripción del proyecto

objetivo principal es demostrar la ejecución de algoritmos aritméticos
*El sistema cuenta con una arquitectura modular que permite realizar dos operaciones:

1.  **Módulo de Suma:** Adición de una unidad .
2.  **Módulo de Resta:** Sustracción de una unidad .

## Requisitos para ejecución:

* **Node.js** (Versión 14.0.0 o superior).
* **NPM** (Gestor de paquetes de Node).

## como instalar y desplegar:

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Ejecutar servidor de desarrollo:**
    ```bash
    npm run dev
    ```

3.  **Abrir en navegador:**
    Acceda a la URL indicada (usualmente `http://localhost:3000`).

## Manual de Uso paso a paso:

### 1. Selección del Módulo
Seleccione la operación deseada en el panel superior:
* **SUMA:** Agrega un símbolo a la cadena.
* **RESTA:** Elimina el último símbolo de la cadena.

### 2. Entrada de Datos (Sistema Unario)
La máquina opera con cadenas de unos.
* **Ejemplo:** Para representar el número **3**, ingrese `111`. Para el **5**, ingrese `11111`.
* Ingrese la cadena en el campo de texto y presione **"Cargar Cinta"**.

### 3. Interpretación de Salida
* Observe el movimiento del cabezal 3D.
* Al finalizar (estado `qFIN`), cuente la cantidad de símbolos `1` restantes en la cinta para obtener el resultado decimal.

---------------------------------------------------

## Documentación Técnica: Tablas de Estados

Las operaciones se realizan en **Sistema Unario**, simplificando la lógica de transición al evitar acarreos binarios.

**Convenciones:**
* **R:** Mover a la derecha (Right).
* **L:** Mover a la izquierda (Left).
* **S:** Mantener posición (Stay).
* **_:** Símbolo vacío (Blank).

### Módulo SUMA :
el algoritmo recorre la cinta hasta encontrar el primer espacio vacío y deposita un '1'.

| Estado | Símbolo Leído | Escribe | Nuevo Estado | Movimiento |
| q0     | 1             | 1       | q0           | R          |
| q0     | _             | 1       | qFIN         | S          |

### Módulo RESTA :
el algoritmo avanza hasta el final de la cadena, retrocede una posición y borra el ultimo símbolo.

| Estado | Símbolo Leído | Escribe | Nuevo Estado | Movimiento |
| q0     | 1             | 1       | q0           | R          |
| q0     | _             | _       | q1           | L          |
| q1     | 1             | _       | qFIN         | S          |



## como se organiza el codigo:

MaquinaTuring
--src
│   |--main.js            #clase principal.
|   |--TuringMachine.js   #logica unaria y reglas de transición.
│   |--TuringRenderer.js  #motor gráfico Three.js
|-- index.html            #interfaz de usuario
|-- vite.config.js        #configuración del proyecto.
|--HARDWARE.md            #hardware y diseño inicial del proyecto
|--DIARO_PROYECTO.md      #diario de avances del proyecto.
