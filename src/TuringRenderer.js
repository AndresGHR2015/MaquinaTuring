import * as THREE from 'three';

/**
 * Clase que renderiza visualmente la Máquina de Turing en 3D
 */
export class TuringRenderer {
    constructor(scene, turingMachine) {
        this.scene = scene;
        this.turingMachine = turingMachine;
        this.tapeGroup = new THREE.Group();
        this.headMesh = null;
        this.cellSize = 1.0;
        this.maxCells = 64;
        this.headPositionSet = false;
        this.previousHeadPosition = 0; 
        this.visualOffset = 0; 
        // Parámetros para el óvalo/pista (ajustados para 64 celdas juntas)
        // Con celdas de 0.8 de ancho, 64 celdas = 51.2 unidades de perímetro aproximado
        this.straightLength = 25;
        this.curveRadius = 5;    
        
        this.scene.add(this.tapeGroup);
        this.createBelt(); 
        this.createFlatTape();
        this.createChassis();
        this.createWriterArm();
        this.createHeadSupport(); 
        this.createTape();
        this.createHead();
    }

    /**
     * Crea el puente fijo (Pilares corregidos para tocar la base)
     */
    createHeadSupport() {
        const supportGroup = new THREE.Group();
        
        // Materiales
        const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9, metalness: 0.1 });
        
        // --- CONFIGURACIÓN DE ALTURA ---
        let headY = 2.0;
        if (this.headMesh && this.headMesh.position) {
            headY = this.headMesh.position.y;
        }

        // CAMBIO: Subimos la viga mucho más (antes era +5.0)
        const beamY = headY + 6.5; 

        // Cálculo del suelo (igual que antes)
        const baseHeight = 1.5; 
        const baseYCenter = -this.curveRadius - 3; 
        const floorY = baseYCenter + (baseHeight / 2); 
        
        // Dimensiones
        const bridgeSpan = 9.0;
        const pillarThick = 1.2;
        
        // 1. VIGA TRANSVERSAL
        const beamGeo = new THREE.BoxGeometry(1.5, 1.0, bridgeSpan + 2);
        const beam = new THREE.Mesh(beamGeo, woodMaterial);
        beam.position.set(0, beamY, 0); 
        supportGroup.add(beam);

        // 2. PILARES VERTICALES (Se estiran automáticamente)
        const pillarHeight = beamY - floorY; 
        const pillarGeo = new THREE.BoxGeometry(pillarThick, pillarHeight, pillarThick);
        const pillarYPos = floorY + (pillarHeight / 2);

        // Pilar Frontal
        const frontPillar = new THREE.Mesh(pillarGeo, woodMaterial);
        frontPillar.position.set(0, pillarYPos, bridgeSpan / 2);
        supportGroup.add(frontPillar);

        // Pilar Trasero
        const backPillar = new THREE.Mesh(pillarGeo, woodMaterial);
        backPillar.position.set(0, pillarYPos, -bridgeSpan / 2);
        supportGroup.add(backPillar);

        this.scene.add(supportGroup);
    }

    /**
     * Versión Final: Brazo Articulado + Dedo Retráctil por defecto.
     * El dedo inicia en posición RETRAÍDA (no toca la cinta).
     */
    createWriterArm() {
        this.writerGroup = new THREE.Group();

        // --- 1. POSICIONES ---
        const touchY = this.curveRadius + 0.6; 
        const targetPos = new THREE.Vector3(0, touchY, 0);
        const pivotY = touchY + 1.2; 
        const pivotZ = 3.4; // Posición ajustada para no chocar con el pilar
        const pivotPos = new THREE.Vector3(0, pivotY, pivotZ);

        const directionVector = new THREE.Vector3().subVectors(targetPos, pivotPos);
        const totalDistance = directionVector.length(); 

        // --- 2. MATERIALES ---
        const bluePlasticMat = new THREE.MeshPhysicalMaterial({ color: 0x0044ff, metalness: 0.1, roughness: 0.2, transmission: 0.6, opacity: 0.9, transparent: true });
        const whiteNylonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const stickerMat = new THREE.MeshBasicMaterial({ color: 0xdaa520 }); 
        const mountBlack = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const actuatorGreyMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
        const fingerTipMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.2, roughness: 0.4 });


        // --- 3. MOTOR ESTÁTICO (Sin cambios) ---
        const servoStaticGroup = new THREE.Group();
        servoStaticGroup.position.copy(pivotPos);
        servoStaticGroup.rotation.y = Math.PI; 
        this.writerGroup.add(servoStaticGroup);

        const sW = 1.2; const sH = 1.3; const sD = 0.6;
        const body = new THREE.Mesh(new THREE.BoxGeometry(sW, sH, sD), bluePlasticMat);
        body.position.set(0, -sH/2 - 0.2, 0); servoStaticGroup.add(body);
        const topPart = new THREE.Mesh(new THREE.BoxGeometry(sW, 0.4, sD), bluePlasticMat);
        topPart.position.set(0, -0.1, 0); servoStaticGroup.add(topPart);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), whiteNylonMat);
        shaft.rotation.x = Math.PI / 2; shaft.position.z = sD/2; servoStaticGroup.add(shaft);
        const tabs = new THREE.Mesh(new THREE.BoxGeometry(sW + 0.8, 0.1, sD), bluePlasticMat);
        tabs.position.set(0, -0.5, 0); servoStaticGroup.add(tabs);
        const sticker = new THREE.Mesh(new THREE.PlaneGeometry(sW - 0.2, sH/2), stickerMat);
        sticker.rotation.y = Math.PI; sticker.position.set(0, -sH/2 - 0.2, -sD/2 - 0.01); servoStaticGroup.add(sticker);
        const mountBlock = new THREE.Mesh(new THREE.BoxGeometry(sW, sH, 0.2), mountBlack);
        mountBlock.position.set(0, -sH/2 - 0.2, -sD/2 - 0.1); servoStaticGroup.add(mountBlock);


        // --- 4. BRAZO DINÁMICO ARTICULADO ---
        const armPivotGroup = new THREE.Group();
        armPivotGroup.position.copy(pivotPos);
        armPivotGroup.position.z -= 0.1; 
        this.writerGroup.add(armPivotGroup);
        armPivotGroup.lookAt(targetPos);

        // --- CÁLCULOS ---
        const actuatorLen = 0.5; 
        const fingerTipLen = 0.4;
        const mainArmLen = totalDistance - (actuatorLen * 0.5) - fingerTipLen;
        
        // División del brazo (Codo)
        const upperArmLen = mainArmLen * 0.4; 
        const foreArmLen = mainArmLen * 0.6;  
        const armWidth = 0.25; const armThickness = 0.1;

        // A) Brazo Superior
        const upperArmGeo = new THREE.BoxGeometry(armWidth, armThickness, upperArmLen);
        upperArmGeo.translate(0, 0, upperArmLen / 2); 
        const upperArm = new THREE.Mesh(upperArmGeo, whiteNylonMat);
        armPivotGroup.add(upperArm);
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.15, 16), new THREE.MeshStandardMaterial({color:0x333333}));
        screw.rotation.x = Math.PI/2; armPivotGroup.add(screw);

        // B) Codo
        const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), whiteNylonMat);
        elbowSphere.position.z = upperArmLen; 
        armPivotGroup.add(elbowSphere);
        const elbowBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16), new THREE.MeshStandardMaterial({color:0x333333}));
        elbowBolt.rotation.x = Math.PI/2; elbowBolt.position.z = upperArmLen; armPivotGroup.add(elbowBolt);

        // C) Antebrazo
        const foreArmGroup = new THREE.Group();
        foreArmGroup.position.z = upperArmLen;
        this.foreArmGroup = foreArmGroup; // Guardar referencia para animaciones
        armPivotGroup.add(foreArmGroup);
        const foreArmGeo = new THREE.BoxGeometry(armWidth, armThickness, foreArmLen);
        foreArmGeo.translate(0, 0, foreArmLen / 2); 
        const foreArm = new THREE.Mesh(foreArmGeo, whiteNylonMat);
        foreArmGroup.add(foreArm);

        // D) Carcasa Actuador
        const actuatorGeo = new THREE.CylinderGeometry(0.18, 0.18, actuatorLen, 16);
        actuatorGeo.rotateX(Math.PI / 2); 
        const actuatorHousing = new THREE.Mesh(actuatorGeo, actuatorGreyMat);
        actuatorHousing.position.z = foreArmLen + (actuatorLen / 2);
        foreArmGroup.add(actuatorHousing);


        // --- CONFIGURACIÓN DEL DEDO RETRÁCTIL ---
        
        // 1. Calcular las posiciones límite
        // Posición extendida (tocando cinta) = final del antebrazo + longitud actuador
        const extendedZ = foreArmLen + actuatorLen;
        // Posición retraída (escondido) = un poco más atrás
        const retractedZ = extendedZ - 0.3;

        // Guardar en la instancia para usar en animaciones
        this.fingerExtendedZ = extendedZ;
        this.fingerRetractedZ = retractedZ;

        // 2. Crear el grupo del dedo
        this.fingerGroup = new THREE.Group();
        
        // CAMBIO PRINCIPAL: INICIAR EN POSICIÓN RETRAÍDA
        this.fingerGroup.position.z = retractedZ; 
        
        foreArmGroup.add(this.fingerGroup);

        // 3. Geometría del pistón
        const fingerGeo = new THREE.CylinderGeometry(0.08, 0.08, fingerTipLen, 16);
        fingerGeo.rotateX(Math.PI / 2); 
        fingerGeo.translate(0, 0, -fingerTipLen / 2); // Ajuste de origen
        const fingerPiston = new THREE.Mesh(fingerGeo, fingerTipMat);
        this.fingerGroup.add(fingerPiston);

        const fingerTipSphere = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 8), fingerTipMat);
        fingerTipSphere.position.z = 0; 
        this.fingerGroup.add(fingerTipSphere);

        this.writerFinger = this.fingerGroup; 


        // --- 5. CABLEADO ---
        const cableStart = new THREE.Vector3(0, pivotPos.y - 1.0, pivotPos.z + 0.5);
        const arduinoX = (-this.straightLength / 2) - 4; 
        const arduinoY = (-this.curveRadius - 3) + 2.0; 
        const arduinoZ = 1.5; 
        const cableEnd = new THREE.Vector3(arduinoX, arduinoY, arduinoZ);
        const midPointMod = new THREE.Vector3(0, -8, 2); 

        if (this.createWire.length > 3 || arguments.length > 2) {
             this.createWire(this.writerGroup, cableStart, cableEnd, midPointMod);
        } else {
             this.createWire(this.writerGroup, cableStart, cableEnd);
        }

        this.scene.add(this.writerGroup);
    }

    /**
     * NUEVO MÉTODO: Anima el dedo para que toque la cinta y se retraiga.
     * Llámalo cuando la máquina escriba un símbolo.
     */
    animateWriteTap() {
        if (!this.writerFinger || this.isAnimatingFinger) return;

        this.isAnimatingFinger = true;
        const speed = 0.05; // Velocidad del movimiento

        // 1. Función para retraer (subir)
        const retract = () => {
            if (this.writerFinger.position.z > this.fingerRetractedZ) {
                this.writerFinger.position.z -= speed;
                requestAnimationFrame(retract);
            } else {
                this.writerFinger.position.z = this.fingerRetractedZ;
                this.isAnimatingFinger = false; // Fin de la animación
            }
        };

        // 2. Función para extender (bajar/tocar)
        const extend = () => {
            if (this.writerFinger.position.z < this.fingerExtendedZ) {
                this.writerFinger.position.z += speed * 2; // Bajar más rápido (golpe)
                requestAnimationFrame(extend);
            } else {
                this.writerFinger.position.z = this.fingerExtendedZ;
                // Una vez que toca, empezar a retraer
                setTimeout(retract, 100); // Esperar 100ms abajo antes de subir
            }
        };

        // Iniciar secuencia: primero asegurar que está retraído, luego golpea
        this.writerFinger.position.z = this.fingerRetractedZ;
        extend();
    }

    /**
     * Crea el soporte físico: Base, Ejes y DOBLE Servo (Dual Drive)
     */
    createChassis() {
        const chassisGroup = new THREE.Group();

        // Materiales
        const woodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b5a2b, 
            roughness: 0.9, 
            metalness: 0.1 
        });
        
        const metalRodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            roughness: 0.4, 
            metalness: 0.6 
        });

        // 1. LA BASE DE MADERA
        const baseLength = this.straightLength + (this.curveRadius * 2) + 8;
        const baseWidth = 10;
        const baseHeight = 1.5;
        const baseY = -this.curveRadius - 3;

        const baseGeo = new THREE.BoxGeometry(baseLength, baseHeight, baseWidth);
        const baseMesh = new THREE.Mesh(baseGeo, woodMaterial);
        baseMesh.position.y = baseY;
        chassisGroup.add(baseMesh);

        // 2. SOPORTES, EJES Y SERVOS (Bucle para ambos lados)
        const supportHeight = Math.abs(baseY) + 1;
        const supportWidth = 1.5;
        const supportDepth = 1.0;
        
        const positionsX = [-this.straightLength / 2, this.straightLength / 2];
        const zFront = 3.5;
        const zBack = -3.5; // Los servos irán aquí

        // Posición del Arduino (para calcular los cables)
        const arduinoPos = new THREE.Vector3(-this.straightLength / 2 - 5, baseY + 1, 0);

        positionsX.forEach((posX) => {
            // --- ESTRUCTURA ---
            
            // EJE (Varilla roscada)
            const axleGeo = new THREE.CylinderGeometry(0.3, 0.3, 8.5, 16);
            const axle = new THREE.Mesh(axleGeo, metalRodMaterial);
            axle.rotation.x = Math.PI / 2;
            axle.position.set(posX, 0, 0);
            chassisGroup.add(axle);

            // TORRE FRONTAL
            const towerFront = new THREE.Mesh(new THREE.BoxGeometry(supportWidth, supportHeight, supportDepth), woodMaterial);
            towerFront.position.set(posX, baseY + (supportHeight / 2), zFront);
            chassisGroup.add(towerFront);

            // TUERCA FRONTAL
            this.addNut(chassisGroup, posX, 0, zFront + 0.6, metalRodMaterial);

            // TORRE TRASERA
            const towerBack = new THREE.Mesh(new THREE.BoxGeometry(supportWidth, supportHeight, supportDepth), woodMaterial);
            towerBack.position.set(posX, baseY + (supportHeight / 2), zBack);
            chassisGroup.add(towerBack);

            // --- MOTORIZACIÓN (DUAL DRIVE) ---
            const servoZ = zBack - 1.5;
            this.createDirectDriveServo(chassisGroup, posX, 0, servoZ);
            const servoPos = new THREE.Vector3(posX, -2, servoZ);
            
            // Punto medio elevado para que el cable haga una curva bonita sobre la máquina
            const midPointOffset = new THREE.Vector3(0, 4, 0); 
            
            this.createWire(chassisGroup, servoPos, arduinoPos, midPointOffset);
        });

        // 3. ARDUINO (El cerebro)
        this.createArduinoBoard(chassisGroup, arduinoPos.x, baseY + baseHeight/2 + 0.1, arduinoPos.z);
        
        this.scene.add(chassisGroup);
    }

    /**
     * Helper para tuercas
     */
    addNut(group, x, y, z, material) {
        const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 6), material);
        nut.rotation.x = Math.PI / 2;
        nut.position.set(x, y, z);
        group.add(nut);
    }

    /**
     * Crea un cable con curva ajustable
     */
    createWire(group, start, end, midPointMod = new THREE.Vector3(0, -5, 0)) {
        // Punto de control medio
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.add(midPointMod); // Modificar la altura de la curva

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Cables de diferentes colores para diferenciar (Rojo vs Negro o similar)
        // Usamos un color aleatorio oscuro para variedad o fijo rojo
        const material = new THREE.LineBasicMaterial({ color: 0xcc3333, linewidth: 2 }); 
        
        const wire = new THREE.Line(geometry, material);
        group.add(wire);
    }

    /**
     * Helper para tuercas
     */
    addNut(group, x, y, z, material) {
        const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 6), material);
        nut.rotation.x = Math.PI / 2;
        nut.position.set(x, y, z);
        group.add(nut);
    }

    /**
     * Crea un Servo Motor estándar (tipo MG996R o Futaba) conectado al eje
     */
    createDirectDriveServo(group, x, y, z) {
        const servoGroup = new THREE.Group();
        servoGroup.position.set(x, y, z);

        // Colores
        const bodyColor = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 }); // Negro plástico
        const labelColor = new THREE.MeshStandardMaterial({ color: 0xdddddd }); // Etiqueta
        const hornColor = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Horn blanco (típico)

        // 1. Cuerpo principal del Servo (Caja rectangular)
        // Dimensiones aprox de un servo estándar escalado
        const bodyW = 4.0; // Ancho
        const bodyH = 2.0; // Alto (visto de frente al eje)
        const bodyD = 3.9; // Profundidad
        
        const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyD, bodyH), bodyColor);
        // Rotamos para que quede vertical y perpendicular al eje
        body.rotation.x = Math.PI / 2; 
        // Ajustamos posición para que el eje de salida (que no está centrado en el servo) coincida con (0,0,0) local
        body.position.set(0, -1.0, 0); 
        servoGroup.add(body);

        // 2. Orejas de montaje (Mounting tabs)
        const tabsGeo = new THREE.BoxGeometry(bodyW + 1.5, 0.2, bodyH);
        const tabs = new THREE.Mesh(tabsGeo, bodyColor);
        tabs.rotation.x = Math.PI / 2;
        tabs.position.set(0, -1.0, 0.5); // Un poco más abajo en Z local
        servoGroup.add(tabs);

        // 3. Eje de salida y "Horn" (La pieza que conecta al eje de la máquina)
        // Un disco blanco que conecta el servo con la varilla roscada
        const hornGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 32);
        const horn = new THREE.Mesh(hornGeo, hornColor);
        horn.rotation.x = Math.PI / 2;
        horn.position.z = 1.0; // Lado que mira hacia la torre (Z positivo local)
        servoGroup.add(horn);

        // 4. Tornillo central del Horn
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16), new THREE.MeshStandardMaterial({color: 0x888888}));
        screw.rotation.x = Math.PI / 2;
        screw.position.z = 1.2;
        servoGroup.add(screw);

        // 5. Etiqueta (para que parezca real)
        const label = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.5), labelColor);
        label.position.set(0, 0, -1.01); // En la "espalda" del servo
        label.rotation.y = Math.PI; // Mirando hacia atrás
        servoGroup.add(label);

        group.add(servoGroup);
    }

    /**
     * Crea un cable simple (Curva Bezier cuadrática)
     */
    createWire(group, start, end) {
        // Punto de control medio (para que el cable cuelgue un poco)
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.y -= 2; // Cae por gravedad

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 }); // Cable rojo
        
        const wire = new THREE.Line(geometry, material);
        group.add(wire);
    }

    // ... (Mantén el método createArduinoBoard del ejemplo anterior) ...
    /**
     * Genera una placa estilo Arduino UNO
     */
    createArduinoBoard(group, x, y, z) {
        const boardGroup = new THREE.Group();
        boardGroup.position.set(x, y, z);

        // PCB Azul
        const pcbMat = new THREE.MeshStandardMaterial({ color: 0x008CBA, roughness: 0.3 }); // Azul Teal
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 3.5), pcbMat);
        boardGroup.add(pcb);

        // Conector USB (Plata)
        const usbMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const usb = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.8), usbMat);
        usb.position.set(-2, 0.4, -0.5);
        boardGroup.add(usb);

        // Headers negros (donde van los cables)
        const headerMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const header1 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 0.3), headerMat);
        header1.position.set(0, 0.3, 1.5);
        boardGroup.add(header1);

        group.add(boardGroup);
    }

   createRollers() {
    const config = {
        radioPrincipal: 4.4,  // Grosor del cilindro gris (ajusta para llenar la curva)
        anchoRodillo: 2.2,    // Largo del cilindro (debe ser igual o mayor al ancho de tu cinta)
        radioTapa: 5,       // Tamaño de los yoyos azules (debe ser mayor al radioPrincipal)
        grosorTapa: 0.2,      // Grosor de la tapa azul
        colorGris: 0xaaaaaa,
        colorAzul: 0x4444ff
    };

    const rollersContainer = new THREE.Group();

    // Materiales compartidos
    const rollerMaterial = new THREE.MeshStandardMaterial({
        color: config.colorGris, metalness: 0.5, roughness: 0.3
    });
    const soporteMaterial = new THREE.MeshStandardMaterial({
        color: config.colorAzul, metalness: 0.6, roughness: 0.3
    });

    // Posiciones (asumiendo que straightLength viene de tu clase)
    const xLeft = -this.straightLength / 2;
    const xRight = this.straightLength / 2;
    
    // Función constructora del rodillo
    const createFullRollerAssembly = () => {
        const assembly = new THREE.Group();

        // 1. Núcleo Gris
        const coreGeo = new THREE.CylinderGeometry(
            config.radioPrincipal, 
            config.radioPrincipal, 
            config.anchoRodillo, 
            32
        );
        const coreMesh = new THREE.Mesh(coreGeo, rollerMaterial);
        coreMesh.rotation.z = Math.PI / 2; 
        assembly.add(coreMesh);

        // 2. Tapas Azules
        const capGeo = new THREE.CylinderGeometry(
            config.radioTapa, 
            config.radioTapa, 
            config.grosorTapa, 
            32
        );
        
        // Tapa Izquierda
        const leftCap = new THREE.Mesh(capGeo, soporteMaterial);
        leftCap.rotation.z = Math.PI / 2;
        leftCap.position.x = -(config.anchoRodillo / 2) - (config.grosorTapa / 2);
        assembly.add(leftCap);

        // Tapa Derecha
        const rightCap = new THREE.Mesh(capGeo, soporteMaterial);
        rightCap.rotation.z = Math.PI / 2;
        rightCap.position.x = (config.anchoRodillo / 2) + (config.grosorTapa / 2);
        assembly.add(rightCap);

        return assembly;
    };

    // --- INSTANCIAR Y ROTAR ---

    // Izquierdo
    const leftRoller = createFullRollerAssembly();
    leftRoller.rotation.y = Math.PI / 2; // Rotar 90 grados para mirar al frente
    leftRoller.position.set(xLeft, 0, 0);
    rollersContainer.add(leftRoller);

    // Derecho
    const rightRoller = createFullRollerAssembly();
    rightRoller.rotation.y = Math.PI / 2; // Rotar 90 grados para mirar al frente
    rightRoller.position.set(xRight, 0, 0);
    rollersContainer.add(rightRoller);

    this.scene.add(rollersContainer);
}

    /**
     * Crea la cinta plana mitad blanca y mitad negra
     */
    createFlatTape() {
        // Parámetros de la cinta
        const straightLength = this.straightLength * 1.01;
        const curveRadius = this.curveRadius * 0.96;
        const tapeWidth = 0.1; // Ancho de la cinta
        const tapeThickness = 1.5; // Grosor suficiente para cubrir el espacio de las celdas
        const halfStraight = straightLength / 2;
        const outerRadius = curveRadius + tapeWidth / 2;
        const innerRadius = curveRadius - tapeWidth / 2;
        
        // Crear la forma completa del óvalo (será la misma para ambas mitades)
        const shape = new THREE.Shape();
        
        // Comenzar en la parte superior izquierda
        shape.moveTo(-halfStraight, outerRadius);
        
        // Línea superior (izquierda a derecha)
        shape.lineTo(halfStraight, outerRadius);
        
        // Curva derecha exterior
        shape.absarc(halfStraight, 0, outerRadius, Math.PI / 2, -Math.PI / 2, true);
        
        // Línea inferior (derecha a izquierda)
        shape.lineTo(-halfStraight, -outerRadius);
        
        // Curva izquierda exterior
        shape.absarc(-halfStraight, 0, outerRadius, -Math.PI / 2, Math.PI / 2, true);
        
        // Crear el agujero interior
        const hole = new THREE.Path();
        hole.moveTo(-halfStraight, innerRadius);
        hole.lineTo(halfStraight, innerRadius);
        hole.absarc(halfStraight, 0, innerRadius, Math.PI / 2, -Math.PI / 2, true);
        hole.lineTo(-halfStraight, -innerRadius);
        hole.absarc(-halfStraight, 0, innerRadius, -Math.PI / 2, Math.PI / 2, true);
        
        shape.holes.push(hole);
        
        // ===== MITAD BLANCA (Z positivo - mitad frontal) =====
        const whiteExtrudeSettings = {
            depth: tapeThickness / 2, // Solo la mitad del grosor
            bevelEnabled: false
        };
        
        const whiteGeometry = new THREE.ExtrudeGeometry(shape, whiteExtrudeSettings);
        // Posicionar desde Z=0 hacia adelante
        whiteGeometry.translate(0, 0, 0);
        
        const whiteMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.1,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        const whiteTape = new THREE.Mesh(whiteGeometry, whiteMaterial);
        whiteTape.position.y = -0.05;
        this.scene.add(whiteTape);
        
        // ===== MITAD NEGRA (Z negativo - mitad trasera) =====
        const blackExtrudeSettings = {
            depth: tapeThickness / 2, // Solo la mitad del grosor
            bevelEnabled: false
        };
        
        const blackGeometry = new THREE.ExtrudeGeometry(shape, blackExtrudeSettings);
        // Posicionar desde Z=0 hacia atrás
        blackGeometry.translate(0, 0, -tapeThickness / 2);
        
        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        const blackTape = new THREE.Mesh(blackGeometry, blackMaterial);
        blackTape.position.y = -0.05;
        this.scene.add(blackTape);
    }

    /**
     * Crea la correa que va debajo de la cinta
     */
    createBelt() {
        // Parámetros deben coincidir con la cinta plana para que queden alineados
        const straightLength = this.straightLength * 0.98;
        const curveRadius = this.curveRadius * 0.93; // Mismo que la cinta plana
        const halfStraight = straightLength / 2;
        const tubeRadius = 0.2; // Radio del tubo (grosor de la correa)
        
        // Crear la curva que define el camino de la correa
        const curve = new THREE.CurvePath();
        
        // Línea superior (izquierda a derecha)
        curve.add(new THREE.LineCurve3(
            new THREE.Vector3(-halfStraight, curveRadius, 0),
            new THREE.Vector3(halfStraight, curveRadius, 0)
        ));
        
        // Curva derecha (semicírculo superior a inferior)
        const rightCurve = new THREE.EllipseCurve(
            halfStraight, 0,  // centro
            curveRadius, curveRadius,  // radios x, y
            Math.PI / 2, -Math.PI / 2,  // ángulo inicio, ángulo fin
            true, // sentido horario
            0  // rotación
        );
        const rightCurve3D = new THREE.CurvePath();
        const points = rightCurve.getPoints(32);
        for (let i = 0; i < points.length - 1; i++) {
            rightCurve3D.add(new THREE.LineCurve3(
                new THREE.Vector3(points[i].x, points[i].y, 0),
                new THREE.Vector3(points[i + 1].x, points[i + 1].y, 0)
            ));
        }
        curve.add(rightCurve3D);
        
        // Línea inferior (derecha a izquierda)
        curve.add(new THREE.LineCurve3(
            new THREE.Vector3(halfStraight, -curveRadius, 0),
            new THREE.Vector3(-halfStraight, -curveRadius, 0)
        ));
        
        // Curva izquierda (semicírculo inferior a superior)
        const leftCurve = new THREE.EllipseCurve(
            -halfStraight, 0,  // centro
            curveRadius, curveRadius,  // radios x, y
            -Math.PI / 2, Math.PI / 2,  // ángulo inicio, ángulo fin
            true, // sentido horario
            0  // rotación
        );
        const leftCurve3D = new THREE.CurvePath();
        const leftPoints = leftCurve.getPoints(32);
        for (let i = 0; i < leftPoints.length - 1; i++) {
            leftCurve3D.add(new THREE.LineCurve3(
                new THREE.Vector3(leftPoints[i].x, leftPoints[i].y, 0),
                new THREE.Vector3(leftPoints[i + 1].x, leftPoints[i + 1].y, 0)
            ));
        }
        curve.add(leftCurve3D);
        
        // Crear geometría de tubo siguiendo la curva
        const geometry = new THREE.TubeGeometry(curve, 128, tubeRadius, 16, true);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2c2c2c, // Gris oscuro
            metalness: 0.3,
            roughness: 0.7
        });
        
        const belt = new THREE.Mesh(geometry, material);
        
        // Posicionar la correa completamente debajo de la cinta plana
        belt.position.y = -0.05; // Más abajo para que no sobresalga por encima de la cinta
        
        this.scene.add(belt);
    }

    createTape() {
        // Limpiar cinta anterior
        this.tapeGroup.clear();

        const tape = this.turingMachine.tape;
        
        // Asegurar que la cinta tenga al menos 64 celdas
        while (tape.length < this.maxCells) {
            tape.push('_');
        }
        
        // Mostrar todas las celdas (hasta maxCells)
        const cellsToShow = Math.min(tape.length, this.maxCells);
        
        // Detectar movimiento del cabezal
        const currentHeadPos = this.turingMachine.headPosition;
        if (currentHeadPos !== this.previousHeadPosition) {
            const movement = currentHeadPos - this.previousHeadPosition;
            // Si el cabezal se mueve a la derecha, offset aumenta (celdas se mueven a la izquierda)
            // Si el cabezal se mueve a la izquierda, offset disminuye (celdas se mueven a la derecha)
            this.visualOffset += movement;
            this.previousHeadPosition = currentHeadPos;
        }
        
        for (let i = 0; i < cellsToShow; i++) {
            // Calcular el índice visual ajustado por el offset
            const visualIndex = i - this.visualOffset;
            const cell = this.createCell(tape[i], visualIndex, cellsToShow);
            this.tapeGroup.add(cell);
        }
    }

    /**
            // PRIMERO: verificar si hay lámina naranja (obstáculo)
            const irObstacleTargets = [];
            this.tapeGroup.children.forEach(cellGroup => {
                if (cellGroup.userData.innerMesh) {
                    irObstacleTargets.push(cellGroup.userData.innerMesh);
                }
            });
            const irObstacleIntersects = this.irRaycaster.intersectObjects(irObstacleTargets, false);
            // Bloquea si detecta cualquier lámina suficientemente cerca
            const irDetectsObstacle = irObstacleIntersects.length > 0 && irObstacleIntersects[0].distance < 1.8;

            // SOLO si NO hay lámina bloqueante, verificar la cinta negra
            let irDetectsBlack = false;
            if (!irDetectsObstacle) {
                const irTargets = [];
                this.scene.traverse((obj) => {
                    if (obj.isMesh && obj.material) {
                        // Buscar meshes con material negro (cinta negra)
                        if (obj.material.color && obj.material.color.getHex() === 0x000000) {
                            irTargets.push(obj);
                        }
                    }
                });
                const irIntersects = this.irRaycaster.intersectObjects(irTargets, false);
                irDetectsBlack = irIntersects.length > 0 && irIntersects[0].distance < 1.8;
            }
            // Ángulo que corresponde a una celda
            const anglePerCell = (2 * Math.PI) / totalCells;
            
            // Si el cabezal se mueve a la derecha (+1), la cinta rota a la izquierda (-)
            // Si el cabezal se mueve a la izquierda (-1), la cinta rota a la derecha (+)
            this.currentRotation -= movement * anglePerCell;
            
            // Aplicar la rotación acumulada
            this.tapeGroup.rotation.z = this.currentRotation;
            
            // Actualizar posición anterior
            this.previousHeadPosition = currentHeadPos;
        }
    }

    /**
     * Rota toda la cinta para que la celda del cabezal quede en la posición 0
     * (MÉTODO DEPRECADO - ahora usamos detectAndRotateTape)
     */
    rotateTapeToHead(totalCells) {
        const headPos = this.turingMachine.headPosition;
        
        // Calcular el ángulo de rotación necesario
        const straightPerimeter = this.straightLength * 2;
        const curvePerimeter = Math.PI * this.curveRadius * 2;
        const totalPerimeter = straightPerimeter + curvePerimeter;
        
        // Distancia angular que debe rotar la cinta
        const headDistance = (headPos / totalCells) * totalPerimeter;
        const rotationAngle = (headDistance / totalPerimeter) * 2 * Math.PI;
        
        // Aplicar rotación al grupo de la cinta
        this.tapeGroup.rotation.z = -rotationAngle;
    }

    /**
     * Calcula la posición de una celda en la pista ovalada
     */
    getCellPosition(index, totalCells) {
        // Calcular el perímetro total de la pista
        const straightPerimeter = this.straightLength * 2;
        const curvePerimeter = Math.PI * this.curveRadius * 2;
        const totalPerimeter = straightPerimeter + curvePerimeter;
        
        // Ajustar para que index=0 esté en la parte superior central (0, curveRadius)
        // Empezamos en la mitad del lado superior
        const startOffset = this.straightLength / 2;
        
        // Distancia recorrida por esta celda
        // Usar módulo que maneje negativos correctamente
        let distance = ((index / totalCells) * totalPerimeter + startOffset) % totalPerimeter;
        if (distance < 0) {
            distance += totalPerimeter;
        }
        
        let x, y, angle;
        
        // Lado superior recto (izquierda a derecha)
        if (distance < this.straightLength) {
            x = -this.straightLength / 2 + distance;
            y = this.curveRadius;
            angle = 0;
        }
        // Curva derecha (superior a inferior)
        else if (distance < this.straightLength + Math.PI * this.curveRadius) {
            const curveDistance = distance - this.straightLength;
            const curveAngle = curveDistance / this.curveRadius;
            x = this.straightLength / 2 + this.curveRadius * Math.sin(curveAngle);
            y = this.curveRadius * Math.cos(curveAngle);
            angle = curveAngle;
        }
        // Lado inferior recto (derecha a izquierda)
        else if (distance < straightPerimeter + Math.PI * this.curveRadius) {
            const straightDistance = distance - (this.straightLength + Math.PI * this.curveRadius);
            x = this.straightLength / 2 - straightDistance;
            y = -this.curveRadius;
            angle = Math.PI;
        }
        // Curva izquierda (inferior a superior)
        else {
            const curveDistance = distance - (straightPerimeter + Math.PI * this.curveRadius);
            const curveAngle = curveDistance / this.curveRadius;
            x = -this.straightLength / 2 - this.curveRadius * Math.sin(curveAngle);
            y = -this.curveRadius * Math.cos(curveAngle);
            angle = Math.PI + curveAngle;
        }
        
        return { x, y, angle };
    }

    createCell(symbol, visualPosition, totalCells) {
        const group = new THREE.Group();
        
        // La celda está iluminada si está en la posición visual 0 (debajo del cabezal)
        const isHeadPosition = visualPosition === 0;
        
        // Dimensiones
        const cellWidth = 1.27;
        const cellHeight = 1.5;
        const frameThickness = 0.2; // Grosor del marco
        const innerDepth = 0.8; // Profundidad de la cavidad
        
        // 1. MARCO EXTERIOR NARANJA (hueco)
        const frameColor = 0xff8c42; // Naranja
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: frameColor,
            metalness: 0.3,
            roughness: 0.6
        });
        
        // Grosores diferentes para hacer el hueco rectangular
        const frameThicknessHorizontal = 0.15; // Grosor de barras superior/inferior (más delgadas)
        const frameThicknessVertical = 0.3;    // Grosor de barras izquierda/derecha (más gruesas)
        
        // Crear marco con 4 barras (arriba, abajo, izquierda, derecha)
        // Barra superior (más delgada)
        const topBar = new THREE.BoxGeometry(cellWidth, frameThickness, frameThicknessHorizontal);
        const topMesh = new THREE.Mesh(topBar, frameMaterial);
        topMesh.position.z = cellHeight / 2 - frameThicknessHorizontal / 2;
        group.add(topMesh);
        
        // Barra inferior (más delgada)
        const bottomBar = new THREE.BoxGeometry(cellWidth, frameThickness, frameThicknessHorizontal);
        const bottomMesh = new THREE.Mesh(bottomBar, frameMaterial);
        bottomMesh.position.z = -cellHeight / 2 + frameThicknessHorizontal / 2;
        group.add(bottomMesh);
        
        // Barra izquierda (más gruesa)
        const leftBar = new THREE.BoxGeometry(frameThicknessVertical, frameThickness, cellHeight - 2 * frameThicknessHorizontal);
        const leftMesh = new THREE.Mesh(leftBar, frameMaterial);
        leftMesh.position.x = -cellWidth / 2 + frameThicknessVertical / 2;
        group.add(leftMesh);
        
        // Barra derecha (más gruesa)
        const rightBar = new THREE.BoxGeometry(frameThicknessVertical, frameThickness, cellHeight - 2 * frameThicknessHorizontal);
        const rightMesh = new THREE.Mesh(rightBar, frameMaterial);
        rightMesh.position.x = cellWidth / 2 - frameThicknessVertical / 2;
        group.add(rightMesh);
        
        // 2. PIEZA MÓVIL INTERIOR (lámina delgada que se mueve en Z)
        const innerWidth = (cellWidth - 2 * frameThicknessVertical); // Ancho disponible
        const innerHeight = (cellHeight - 2 * frameThicknessHorizontal - 0.1) / 6; // Alto disponible
        const laminaThickness = 0.6; // Grosor de la lámina (muy delgada)
        
        // Determinar posición según el símbolo (la lámina siempre es naranja)
        let zPosition;
        switch(symbol) {
            case '1':
                zPosition = -0.3; // Atrás
                break;
            case '0':
                zPosition = 0; // Centro
                break;
            case '_':
                zPosition = 0.3; // Adelante
                break;
            default:
                zPosition = 0;
        }
        
        // La lámina siempre es del mismo color que el marco (naranja)
        const innerMaterial = new THREE.MeshStandardMaterial({
            color: frameColor, // Mismo color que el marco
            metalness: 0.2,
            roughness: 0.7
        });
        
        // Lámina delgada (BoxGeometry: ancho en X, alto en Y, grosor en Z)
        const innerGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, laminaThickness);
        const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
        innerMesh.position.x = 0; // Centrada en X
        innerMesh.position.z = zPosition; // Varía en Z
        innerMesh.userData.targetZ = zPosition; // Para animaciones futuras
        innerMesh.userData.currentSymbol = symbol;
        group.add(innerMesh);
        
        // Guardar referencia a la pieza móvil para animaciones
        group.userData.innerMesh = innerMesh;

        // Texto del símbolo - visible desde arriba
        const textPlane = this.createTextSprite(symbol, isHeadPosition);
        textPlane.position.y = frameThickness / 2 + 0.15; // Encima del marco
        group.add(textPlane);

        // Calcular posición en la pista ovalada usando la posición visual
        const pos = this.getCellPosition(visualPosition, totalCells);
        
        group.position.x = pos.x;
        group.position.y = pos.y - frameThickness / 2; // Bajar las celdas para que el fondo toque la correa
        group.position.z = 0;
        
        // Rotar la celda para que siga la tangente de la pista
        group.rotation.z = -pos.angle;
        
        return group;
    }

    createTextSprite(text, isActive = false) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        
        context.fillStyle = isActive ? '#ffffff' : '#333333';
        context.font = 'Bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Usar un PlaneGeometry para que sea visible desde arriba
        const planeGeometry = new THREE.PlaneGeometry(0.6, 0.6);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        
        // Rotar el plano para que sea visible desde arriba (paralelo al plano XZ)
        plane.rotation.x = -Math.PI / 2;
        
        return plane;
    }

    createHead() {
        // Grupo para el cabezal completo (doble sensor)
        this.headGroup = new THREE.Group();
        
        // ===== CUERPO PRINCIPAL DEL CABEZAL (AGRANDADO) =====
        // ANTES: new THREE.BoxGeometry(0.8, 0.4, 1.2);
        // AHORA: Más ancho (2.2), más alto (0.7) y más profundo (1.8) para tapar el hueco
        const bodyWidth = 0.7;
        const bodyHeight = 2.2;
        const bodyDepth = 1.8;
        
        const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c3e50, // Gris azulado
            metalness: 0.6,
            roughness: 0.3
        });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        // Lo subimos ligeramente para que su centro siga estando cerca de la posición de lectura
        bodyMesh.position.y = 0.9; 
        this.headGroup.add(bodyMesh);
        
        // Guarda la altura media del techo del cabezal para usarla en los soportes
        // Posición Y del mesh + mitad de su altura
        this.headTopYOffset = 0.15 + (bodyHeight / 2);
        
        // ===== SENSOR INFERIOR (INFRARROJO DE COLOR) =====
        // Ahora el IR va en el lado opuesto (frontal, z = +0.5)
        const irSensorGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.3);
        const irSensorMaterial = new THREE.MeshStandardMaterial({
            color: 0xe74c3c, // Rojo
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0xe74c3c,
            emissiveIntensity: 0.4
        });
        const irSensor = new THREE.Mesh(irSensorGeometry, irSensorMaterial);
        irSensor.position.y = -0.25; // Abajo del cuerpo
        irSensor.position.z = 0.5; // Frontal
        this.headGroup.add(irSensor);

        // Haz infrarrojo (rojo, vertical hacia abajo)
        const irBeamLength = 0.8;
        const irBeamGeometry = new THREE.CylinderGeometry(0.02, 0.04, irBeamLength, 8);
        const irBeamMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000, // Rojo brillante
            transparent: true,
            opacity: 0.6,
            emissive: 0xff0000,
            emissiveIntensity: 1.0
        });
        const irBeam = new THREE.Mesh(irBeamGeometry, irBeamMaterial);
        irBeam.position.y = -0.25 - irBeamLength / 2;
        irBeam.position.z = 0.5;
        this.headGroup.add(irBeam);

        // ===== SENSOR SUPERIOR (LÁSER DE DISTANCIA) =====
        // Ahora el láser va en el lado trasero (z = -0.5)
        const laserSensorGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.3);
        const laserSensorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3498db, // Azul
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x3498db,
            emissiveIntensity: 0.4
        });
        const laserSensor = new THREE.Mesh(laserSensorGeometry, laserSensorMaterial);
        laserSensor.position.y = -0.25; // Abajo del cuerpo
        laserSensor.position.z = -0.5; // Trasero
        this.headGroup.add(laserSensor);

        // Haz láser (azul, vertical hacia abajo)
        const laserBeamLength = 0.8;
        const laserBeamGeometry = new THREE.CylinderGeometry(0.02, 0.04, laserBeamLength, 8);
        const laserBeamMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Cian brillante
            transparent: true,
            opacity: 0.7,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0
        });
        const laserBeam = new THREE.Mesh(laserBeamGeometry, laserBeamMaterial);
        laserBeam.position.y = -0.25 - laserBeamLength / 2;
        laserBeam.position.z = -0.5;
        this.headGroup.add(laserBeam);
        
        // Guardar referencias para raycasting
        this.headGroup.userData.laserBeam = laserBeam;
        this.headGroup.userData.irBeam = irBeam;
        this.headGroup.userData.laserSensor = laserSensor;
        this.headGroup.userData.irSensor = irSensor;
        
        // Crear raycasters con distancia máxima configurada
        this.laserRaycaster = new THREE.Raycaster();
        this.laserRaycaster.far = 5.0; // Alcance de 5 unidades
        this.irRaycaster = new THREE.Raycaster();
        this.irRaycaster.far = 5.0; // Alcance de 5 unidades
        
        // Posicionar el cabezal
        this.headMesh = this.headGroup;
        this.updateHeadPosition();
        
        this.scene.add(this.headGroup);
    }

    updateHeadPosition() {
        if (this.headMesh && !this.headPositionSet) {
            // El cabezal siempre está en la posición de la celda 0 (centro superior)
            const totalCells = Math.min(this.turingMachine.tape.length, this.maxCells);
            const pos = this.getCellPosition(0, totalCells);
            
            this.headMesh.position.x = pos.x;
            this.headMesh.position.z = 0; // Mismo Z que las celdas
            this.headMesh.position.y = pos.y + 1.5; // Arriba de la pista
            
            // Rotar el cabezal para seguir la orientación de la pista en la posición 0
            this.headMesh.rotation.z = -pos.angle;
            
            // Marcar que la posición ya fue establecida
            this.headPositionSet = true;
        }
    }

    /**
     * Lee los sensores usando Raycaster y determina el símbolo
     * Retorna: { symbol: '1'|'0'|'_', laserDetection: boolean, irDetection: boolean }
     */
  readSensors() {
    if (!this.headGroup || !this.tapeGroup) {
        return { symbol: '_', laserDetection: false, irDetection: false, error: 'Sensores no inicializados' };
    }

    // Obtener posición mundial del cabezal
    const headWorldPos = new THREE.Vector3();
    this.headGroup.getWorldPosition(headWorldPos);
    
    // Recopilamos las láminas móviles (innerMesh)
    // Estas sirven como OBJETIVO para el Láser y como OBSTÁCULO para el IR
    const movingSheets = [];
    this.tapeGroup.children.forEach(cellGroup => {
        if (cellGroup.userData.innerMesh) {
            movingSheets.push(cellGroup.userData.innerMesh);
        }
    });

    const laserDirection = new THREE.Vector3(0, -1, 0);
    const laserOrigin = new THREE.Vector3(
        headWorldPos.x,
        headWorldPos.y - 0.25,
        headWorldPos.z - 0.5 // Lado Trasero
    );
    this.laserRaycaster.set(laserOrigin, laserDirection);

    // El láser solo le interesa si choca con las láminas
    const laserIntersects = this.laserRaycaster.intersectObjects(movingSheets, false);
    const laserDetectsWall = laserIntersects.length > 0 && laserIntersects[0].distance < 3.0;

    const irDirection = new THREE.Vector3(0, -1, 0);
    const irOrigin = new THREE.Vector3(
        headWorldPos.x,
        headWorldPos.y - 0.25,
        headWorldPos.z + 0.5 // Lado Frontal
    );
    this.irRaycaster.set(irOrigin, irDirection);

    const irAllPhysicalObjects = [...movingSheets]; 
    this.scene.traverse((obj) => {
        if (obj.isMesh && obj.material && obj.material.color && obj.material.color.getHex() === 0x000000) {
            irAllPhysicalObjects.push(obj);
        }
    });

    // B. Lanzamos UN SOLO rayo contra todo el mundo
    const irIntersects = this.irRaycaster.intersectObjects(irAllPhysicalObjects, false);

    // C. Lógica de "El Primer Impacto Manda"
    let irDetectsBlack = false;

    if (irIntersects.length > 0) {
        const firstHit = irIntersects[0]; // El objeto más cercano al sensor
        
        // Verificamos que esté dentro del rango físico del sensor (1.8 unidades)
        if (firstHit.distance < 1.8) {
            // ¿Con qué chocó?
            if (firstHit.object.material.color.getHex() === 0x000000) {
                // Chocó con el fondo negro -> El camino estaba libre
                irDetectsBlack = true;
            } else {
                // Chocó con una lámina (naranja/gris) -> El camino estaba obstruido
                // Por lo tanto, NO ve negro.
                irDetectsBlack = false; 
            }
        }
    }

    let detectedSymbol;
    if (laserDetectsWall && irDetectsBlack) {
        detectedSymbol = '1';
    } else if (!laserDetectsWall && irDetectsBlack) {
        detectedSymbol = '0';
    } else if (!laserDetectsWall && !irDetectsBlack) {
        detectedSymbol = '_';
    } else {
        // Caso extraño: Láser detecta pared arriba, pero IR no detecta negro abajo.
        detectedSymbol = '?'; 
    }

    // Debug info
    const result = {
        symbol: detectedSymbol,
        laserDetection: laserDetectsWall,
        irDetection: irDetectsBlack,
        laserDistance: laserIntersects.length > 0 ? laserIntersects[0].distance.toFixed(2) : 'N/A',
        irDistance: irIntersects.length > 0 ? irIntersects[0].distance.toFixed(2) : 'N/A',
        irHitsObjType: irIntersects.length > 0 ? (irDetectsBlack ? "FONDO NEGRO" : "OBSTACULO") : "NADA"
    };

    return result;
}


    update(forceRecreate = false) {
        // Solo recrear la cinta si es necesario (cuando cambia el estado de la máquina)
        if (forceRecreate) {
            this.createTape();
        }
        this.updateHeadPosition();
        this.animateMovingPieces();
        
        // Leer sensores y mostrar información (debug) - solo cada ciertos frames para optimizar
        if (!this.sensorCheckCounter) this.sensorCheckCounter = 0;
        this.sensorCheckCounter++;
        
        // Leer sensores cada 10 frames (no en cada frame)
        if (this.sensorCheckCounter % 10 === 0 && this.headGroup && this.laserRaycaster) {
            const sensorData = this.readSensors();
            
            // Actualizar colores de los haces según detección
            if (this.headGroup.userData.laserBeam) {
                this.headGroup.userData.laserBeam.material.opacity = sensorData.laserDetection ? 1.0 : 0.4;
            }
            if (this.headGroup.userData.irBeam) {
                this.headGroup.userData.irBeam.material.opacity = sensorData.irDetection ? 0.9 : 0.3;
            }
            
            // Log en consola (solo si cambió el símbolo detectado)
            if (!this.lastDetectedSymbol || this.lastDetectedSymbol !== sensorData.symbol) {
                console.log('🔍 SENSORES:', {
                    'Símbolo Detectado': sensorData.symbol,
                    'Láser (Pared)': sensorData.laserDetection ? '✅ DETECTA' : '❌ NO DETECTA',
                    'IR (Negro)': sensorData.irDetection ? '✅ NEGRO' : '❌ BLANCO/NARANJA',
                    'Distancia Láser': sensorData.laserDistance,
                    'Distancia IR': sensorData.irDistance,
                    '🎯 Láser Hits': sensorData.laserHits + '/' + sensorData.laserTargetsCount,
                    '🎯 IR Hits': sensorData.irHits + '/' + sensorData.irTargetsCount
                });
                this.lastDetectedSymbol = sensorData.symbol;
            }
        }
    }
    
    /**
     * Anima suavemente las piezas móviles de las celdas hacia su posición objetivo
     */
    animateMovingPieces() {
        if (!this.tapeGroup) return;
        
        const lerpSpeed = 0.15; // Velocidad de interpolación (0-1, mayor = más rápido)
        
        this.tapeGroup.children.forEach(cellGroup => {
            if (!cellGroup.userData.innerMesh) return;
            
            const innerMesh = cellGroup.userData.innerMesh;
            const targetZ = innerMesh.userData.targetZ;
            
            // Interpolación suave (lerp) hacia la posición objetivo en Z
            if (Math.abs(innerMesh.position.z - targetZ) > 0.001) {
                innerMesh.position.z += (targetZ - innerMesh.position.z) * lerpSpeed;
            } else {
                innerMesh.position.z = targetZ; // Snap final para evitar oscilaciones
            }
        });
    }

    updateMachine(newTuringMachine) {
        // Actualizar referencia a la nueva máquina
        this.turingMachine = newTuringMachine;
        this.headPositionSet = false; // Resetear para recalcular posición con nueva máquina
        this.previousHeadPosition = 0; // Resetear posición previa
        this.visualOffset = 0; // Resetear offset visual
        this.createTape();
    }

    /**
     * Para escribir '1', el dedo sale más para alcanzar el fondo.
     */
    animateWriteOperation(symbol, onWriteMoment, onComplete) {
        if (this.isAnimating || !this.writerFinger) return;
        this.isAnimating = true;

        const duration = 400; // ms
        const startTime = performance.now();

        // 1. ESTADOS INICIALES
        const startFingerZ = this.fingerRetractedZ;
        const startElbowRot = 0;
        
        // --- CÁLCULO DE PROFUNDIDAD DINÁMICA ---
        // Dependiendo del símbolo que vamos a escribir, el dedo necesita salir más o menos.
        // '1' = Placa abajo del todo -> El dedo tiene que entrar profundo.
        // '0' = Placa al medio -> Profundidad media.
        // '_' = Placa arriba -> El dedo solo toca la superficie.
        
        let depthOffset = 0;
        switch(symbol) {
            case '1':
                // Empujar profundo (ajusta este 0.5 si es mucho o poco)
                depthOffset = 0.5; 
                break;
            case '0':
                // Empujar medio
                depthOffset = 0.25;
                break;
            case '_':
            default:
                // Tocar superficie (un pequeño empujón para asegurar contacto visual)
                depthOffset = 0.05;
                break;
        }

        // La posición objetivo final es la base extendida + el offset calculado
        const targetFingerZ = this.fingerExtendedZ + depthOffset;
        // Un poco más de flexión de codo si el golpe es profundo
        const targetElbowRot = THREE.MathUtils.degToRad(15 + (depthOffset * 10)); 
        
        // Referencias
        const finger = this.writerFinger;
        const elbow = this.foreArmGroup;
        let hasWritten = false;

        const animateFrame = (currentTime) => {
            const elapsed = currentTime - startTime;
            let progress = elapsed / duration;
            if (progress >= 1) progress = 1;

            // Curva de ida y vuelta (sinusoidal)
            const movementCurve = Math.sin(progress * Math.PI); 

            // A. ANIMACIÓN DEL DEDO (Pistón)
            const currentFingerZ = startFingerZ + (targetFingerZ - startFingerZ) * movementCurve;
            finger.position.z = currentFingerZ;

            // B. ANIMACIÓN DEL CODO
            const currentElbowRot = startElbowRot + (targetElbowRot - startElbowRot) * movementCurve;
            if (elbow) elbow.rotation.x = currentElbowRot;

            // --- MOMENTO DE ESCRITURA (Al 50%) ---
            if (progress > 0.5 && !hasWritten) {
                if (onWriteMoment) onWriteMoment(symbol);
                hasWritten = true;
            }

            // --- FINALIZAR ---
            if (progress < 1) {
                requestAnimationFrame(animateFrame);
            } else {
                // Restaurar posiciones exactas
                finger.position.z = this.fingerRetractedZ;
                if (elbow) elbow.rotation.x = 0;
                this.isAnimating = false;
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animateFrame);
    }
}
