# Documentación técnica: Prototipo físico 

Este documento detalla las especificaciones del componente físico diseñado inicialmente para la Máquina de Turing. Se documenta para cumplir con los requisitos de diseño de hardware de la pauta.

## Materiales 

* **controlador:** Arduino uno R3.
* **actuadores:**
    *  Motor paso a paso 28BYJ-48 (5V) + driver ULN2003.
    *  Micro servo SG90 (9g) para el cabezal.
* **sensor:**
    * Módulo Sensor Infrarrojo TCRT5000 (Lectura de línea).
* **otros :**
    * Cinta de papel continuo (30mm ancho).
    * Protoboard y cables jumper.
    * Estructura de soporte.

## Conexiones:

Configuración de pines para Arduino:

| Componente        | Pin arduino  | Funcion                              |
| **Sensor IR**     | A0           | Entrada analógica (Lectura de cinta) |
| **Motor pasos**   | 8, 9, 10, 11 | Control de bobinas (IN1-IN4)         |
| **Servo**         | 6            | PWM para movimiento del brazo        |
| **Alimentacion**  | 5V / GND     | alimentación común                   |

## Montaje y calibracion:

* **Codificación de cinta:** 
    * Marca negra = '1'
    * Espacio blanco = Vacío
    * Marca doble = '0' (como separador)

* **porque se decicio cambiar a digital:**
    1.  **Calibración del Sensor:** El TCRT5000 requiere una distancia muy precisa (1-2mm). La vibracion natural del motor  generaba lecturas erróneas (falsos positivos/negativos) 
    2.  **Ruido:** La luz ambiental afectaba los umbrales de lectura, requiriendo recalibración constante.
    3. **Economia:** No se entregaron recursos para la creación de nuestro proyecto y no estamos en la situación economica de poder hacer una maquina de turing.

