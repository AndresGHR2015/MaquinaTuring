# DIARIO DE PROYECTO: MÁQUINA DE TURING

**Asignatura:** Fundamentos de la Computación
**Profesor:** José Luis Veas
**Integrantes:**
* Andrés Hidalgo
* Catalina Araya
**Estado:** Finalizado (Digital)
**Tecnologías:** JavaScript (ES6), Three.js, Vite.

---

## FASE 1:Diseño (Sistema Unario)
**Período:** 31 de agosto - 11 de septiembre

### Entrada: 01/09 .
**responsables:** Ambos
**decision final:** Se diseñaron las tablas de estados teóricas basadas en **Sistema Unario**.
**porque:** El sistema unario facilita la comprensión de la lógica básica de Turing sin la complejidad del acarreo de bits. Se entregó la documentación teórica bajo esta premisa.

------------------------------------------------------

## FASE 2: implementacion fisica
**fechas:** 12 de septiembre - 20 de octubre

### Entrada: 30/09 .
**responsable** Andrés Hidalgo
**avance:** Cotización preliminares con Arduino y partes.
**Nota importante:** El costo de los materiales(carriles, sensores de alta fidelidad) supera el presupuesto. Las pruebas con materiales caseros resultaban en atascos constantes de la cinta y lecturas erróneas.

### Entrada: 15/10 .
**responsables:** Ambos
**finalmente se decide:** Se descartó el montaje físico.
**porque:** El riesgo de fallo mecánico durante la presentación era demasiado alto. Se optó por una simulación web que permite visualizar la lógica, además esto esta dentro de los limites autorisados por  el profesor.

----------------------------------------------------------

## FASE FINAL: Desarrollo codigo (Simulación 3D):
**Período:** 23 de octubre - Presente

### Entrada: 25/10 .
**Responsable:** Andrés Hidalgo
**Avance:** Se configuró el proyecto utilizando **Vite** para el empaquetado y **Three.js** para la visualización.
**Estructura:** Se decidió separar la lógica matemática de la visualización:
1.  `TuringMachine.js`: Clase que maneja el array de datos (la cinta) y los estados.
2.  `TuringRenderer.js`: Clase encargada de pintar los cubos y el cabezal en 3D.

### Entrada: 05/11 :
**responsable:** Catalina Araya
**que se hizo:** En revisión con el profesor, se nos indicó que la prioridad es que la máquina funcione sin errores
**Cambio:**
* **Eliminación de multiplicación:** Se acordó eliminar la operación de multiplicación  respecto a comentarios del profesor
* **Nota:** Se nos exigió que el cambio de estado y la escritura en cinta sean evidentes.

### Entrada: 12/11 .
**responsables:** ambos
**desarrollo:** Programación de la clase `TuringMachine`.
* Se implementó un sistema modular: `moduloSuma()` y `moduloResta()`.
* **arreglamos la documentación:** Aunque inicialmente pensamos la lógica en unario puro (palitos), el código se optimizó para trabajar con estados que procesan símbolos `0` y `1` en la cinta, permitiendo operaciones de incremento y decremento de manera más eficiente y ordenada para la visualización.
* **nota:** Se encontraron discrepancias en los comentarios generados automáticamente por el asistente de código (Copilot), pero se verificó manualmente que la lógica de transición `q0` -> `q1` -> `qFIN` ejecuta la operación correctamente sobre la cinta.

### Entrada: 18/11 - Visualización e Interfaz (TuringRenderer.js)
**responsable:** Andrés Hidalgo
**desarrollo:** Se implementó la cinta infinita visual.
* Se crearon geometrías 3D para representar las celdas.
* Se añadió un "Cabezal" (cono rojo/verde) que se anima físicamente al cambiar de módulo, simulando el intercambio de hardware que hubiese ocurrido en la máquina física.

### Entrada: 21/11 - Pruebas Finales y Pulido
**responsables:** Ambos
**Estado:**
* [x] La máquina lee el input correctamente.
* [x] Los botones de control (Play, Pause, Step) funcionan.
* [x] La operación de Resta maneja correctamente el retroceso del cabezal.
* [x] **Requisito Cumplido:** La simulación demuestra visualmente los pasos primitivos del algoritmo.
