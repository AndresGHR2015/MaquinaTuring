# DIARIO DE PROYECTO: MÁQUINA DE TURING

**Asignatura:** Fundamentos de la Computación
**Profesor:** José Luis Veas Muñoz
**Equipo de proyecto:**
* Andrés Hidalgo Ramallo, RUT: 21.795.550-5
* Catalina Araya Avila, RUT: 21.791.560-0

**Estado:** Finalizado (Digital)
**Tecnologías implementadas:** JavaScript (ES6), Three.js, Vite.

---

## FASE 1: Diseño (Sistema Unario)
**Período:** 31 de agosto - 11 de septiembre

### Entrada: 01/09
**Responsables:** Ambos
**Decisión final:** Implementar las tablas de estado teóricas basadas en  **Sistema Unario**.
**Justificación:** Se priorizó la simplicidad lógica para asegurar la correcta demostración de los principios fundamentales de la maquina de turing , evitando la complejidad del acarreo binario.
Se entregó la documentación teórica bajo esta premisa.

---

## FASE 2: Implementación Física
**Período:** 12 de septiembre - 20 de octubre

### Entrada: 30/09
**Responsable:** Andrés Hidalgo
**Avance:** Recopilación de cotizaciones de componentes(Arduino, motores NEMA 17, sensores).
**Nota importante:** El costo de los materiales de alta fidelidad (carriles, sensores) excede el presupuesto. El uso de alternativas económicas genera fallos criticos (atascos, errores de lectura). Se continuará buscando una solución que reduzca el riesgo de errores en la maquina.

### Entrada: 15/10
**Responsables:** Ambos
**Avance:** Evaluación de riesgo y vialidad fisica.
**Decisión final:** Se descartó el montaje físico.
**Justificación:** La probabilidad de fallo mecánico era inaceptablemente alto para la presentacion. Se optó por una simulación web que permite visualizar la lógica; además, está alineada con los alcances autorizados por el docente.

---

## FASE 3: Desarrollo de Código (Simulación 3D)
**Período:** 23 de octubre - 25 de noviembre

### Entrada: 25/10 - Configuración Inicial
**Responsable:** Andrés Hidalgo
**Avance:** Se configuró el proyecto utilizando **Vite** para el empaquetado y **Three.js** para la visualización (entorno de desarrollo).
**Observaciones:** Se decidió separar la lógica matemática de la visualización en `TuringMachine.js` (Lógica) y `TuringRenderer.js` (Gráficos).

### Entrada: 05/11 - Ajuste de Alcance
**Responsable:** Catalina Araya
**Actividad:** En revisión con el profesor, se indicó priorizar el funcionamiento sin errores.(Ajuste de alcance funcional)
**Cambios:** tras la revision con el profesor, se elimino las función de multiplicación para priorizar el funcinamiento estable y poder procesar sin errores las funciones de **Suma** y **Resta**, la escritura en la cinta debe ser perfecta.

### Entrada: 12/11 - Lógica Matemática
**Responsables:** Ambos
**Avance:** Consolidación de la lógica matematica.
**Desarrollo:** Programación de la clase `TuringMachine`. Implementación de módulos de suma y resta. Corrección de la lógica de transición `q0` -> `q1` -> `qFIN`.

### Entrada: 15/11 - Control de Versiones
**Responsable:** Andrés Hidalgo
**Hito:** Primer commit oficial al repositorio.
* `Initial commit: Simulador de Máquina de Turing con Three.js`.

### Entrada: 19/11 - Lógica Core y Esqueleto
**Responsable:** Andrés Hidalgo
**Desarrollo:** Se consolidó la lógica de los autómatas y la estructura base de la cinta.
* **Commits:**
    * Implementación de autómatas suma y resta funcionales.
    * Esqueleto de la cinta y el cabezal funcional implementado.
    * Reajuste de autómatas y finalización de primer prototipo cinta funcional.

### Entrada: 22/11 - Documentación y Diseño Visual
**Responsables:** Catalina Araya (Documentación) / Andrés Hidalgo (Diseño 3D)
**Desarrollo:** Se trabajó en la documentación técnica del hardware descartado y el diseño final de la cinta 3D.
* **Commits (Andrés):**
    * Diseño de la cinta finalizado.
* **Commits (Catalina):**
    * Documentación técnica: Respaldo de specs hardware (Arduino/TCRT5000).
    * Bitácora del proyecto y documentación de fases.
    * Edición del README para claridad y formato.

### Entrada: 23/11 - Implementación de Hardware Simulado
**Responsable:** Andrés Hidalgo
**Desarrollo:** Integración masiva de componentes 3D para simular la máquina física (Digital Twin).
* **Commits:**
    * Simulación realista de lectura de símbolos con sensor de distancia láser + sensor IR funcional implementada.
    * Mejora UI/UX del menú de interacción.
    * Rodillos creados.
    * Soporte implementado + Servo motores + Arduino.
    * Cabezal implementado + Animación de marcado/cambio de símbolos.

### Entrada: 25/11 - Despliegue y Entrega Final
**Responsable:** Andrés Hidalgo
**Desarrollo:** Correcciones finales de rutas para GitHub Pages y cierre de documentación.
* **Commits:**
    * Finalización de documentación + despliegue.
    * Corrección de despliegue (configuración de Vite `base`).
    * Update README.md.

### Estado Final del Proyecto
* [x] La máquina lee el input correctamente.
* [x] Los botones de control (Play, Pause, Step) funcionan.
* [x] La operación de Resta maneja correctamente el retroceso del cabezal.
* [x] **Requisito Cumplido:** La simulación demuestra visualmente los pasos primitivos del algoritmo.
