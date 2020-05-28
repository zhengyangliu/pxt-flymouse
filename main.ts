/**
* StormScience Niko robot package
* @author ArthurZheng
*/
//% weight=10 icon="\uf135" color=#2896ff
namespace niko {

    export enum Motor {
        //% block="M1"
        M1 = 0,
        //% block="M2"
        M2 = 1,
        //% block="M3"
        M3 = 2,
        //% block="M4"
        M4 = 3
    }

    export enum Direction {
        //% block="Forward"
        Forward = 0,
        //% block="Backward"
        Backward = 1,
        //% block="Left"
        Left = 2,
        //% block="Right"
        Right = 3,
        //% block="Clockwise"
        Clockwise = 4,
        //% block="Anti-clockwise"
        AntiClockwise = 5,
    }

    // pin define
    const M1_DIR = pcf8574x.IO.P6;
    const M2_DIR = pcf8574x.IO.P5;
    const M3_DIR = pcf8574x.IO.P3;
    const M4_DIR = pcf8574x.IO.P2;
    const MOTOR_BRK = pcf8574x.IO.P4;
    const GUN_EN = pcf8574x.IO.P7;

    const M1_EN = AnalogPin.P7;
    const M2_EN = AnalogPin.P6;
    const M3_EN = AnalogPin.P5;
    const M4_EN = AnalogPin.P4;

    const M1_RREVERSE = false;
    const M2_RREVERSE = false;
    const M3_RREVERSE = false;
    const M4_RREVERSE = false;

    let _lastM1Speed = 0;
    let _lastM2Speed = 0;
    let _lastM3Speed = 0;
    let _lastM4Speed = 0;

    // 10Khz 100us
    const MOTOR_PWM_PERIOD = 100;

    //% blockId=initNiko block="initialise niko"
    //% weight=100
    //% blockGap=50
    export function initNiko() {

        pcf8574x.configAddress(0x20);
        pcf8574x.writeMode(0);

        pins.analogSetPeriod(M1_EN, MOTOR_PWM_PERIOD);
        pins.analogSetPeriod(M2_EN, MOTOR_PWM_PERIOD);
        pins.analogSetPeriod(M3_EN, MOTOR_PWM_PERIOD);
        pins.analogSetPeriod(M4_EN, MOTOR_PWM_PERIOD);

        initPS2();
    }

    /**
     * set motor speed
     * @param {Motor} m - the motor want to sets
     * @param {number} speed - run speed 
     */
    //% blockId=setMotorSpeed block="set motor $m speed as $speed"
    //% speed.min=-1023 speed.max=1023
    //% speed.defl=0
    //% weight=96
    export function setMotorSpeed(m: Motor, speed: number) {

        // release brake
        pcf8574x.writePinMode(MOTOR_BRK, pcf8574x.Mode.Low);

        if (m == Motor.M1) {
            // if speed now is opposite to last time, brake 10ms to avoid motor short-circuit 
            if ((_lastM1Speed < 0) && (speed > 0) || (_lastM1Speed > 0) && (speed < 0)) {
                pcf8574x.writePinMode(M1_DIR, pcf8574x.Mode.High);
                pins.analogWritePin(M1_EN, speed);
                _lastM1Speed = speed;
            }
            // set dir pin and pwm pluse
            if (speed >= 0) {
                pcf8574x.writePinMode(M1_DIR, pcf8574x.Mode.High);
                pins.analogWritePin(M1_EN, speed);
                _lastM1Speed = speed;
            }
            else {
                pcf8574x.writePinMode(M1_DIR, pcf8574x.Mode.Low);
                pins.analogWritePin(M1_EN, -speed);
                _lastM1Speed = speed;
            }
        }
        else if (m == Motor.M2) {
            if ((_lastM1Speed < 0) && (speed > 0) || (_lastM1Speed > 0) && (speed < 0)) {
                pcf8574x.writePinMode(M2_DIR, pcf8574x.Mode.High);
                pins.analogWritePin(M2_EN, speed);
                _lastM1Speed = speed;
            }
            if (speed >= 0) {
                pcf8574x.writePinMode(M2_DIR, pcf8574x.Mode.High);
                pins.analogWritePin(M2_EN, speed);
                _lastM1Speed = speed;
            }
            else {
                pcf8574x.writePinMode(M2_DIR, pcf8574x.Mode.Low);
                pins.analogWritePin(M2_EN, -speed);
                _lastM1Speed = speed;
            }
        }
        else if (m == Motor.M3) {
            if ((_lastM1Speed < 0) && (speed > 0) || (_lastM1Speed > 0) && (speed < 0)) {
                pcf8574x.writePinMode(M3_DIR, pcf8574x.Mode.High);
                pins.analogWritePin(M3_EN, speed);
                _lastM1Speed = speed;
            }
            if (speed >= 0) {
                pcf8574x.writePinMode(M3_DIR, pcf8574x.Mode.High);
                pins.analogWritePin(M3_EN, speed);
                _lastM1Speed = speed;
            }
            else {
                pcf8574x.writePinMode(M3_DIR, pcf8574x.Mode.Low);
                pins.analogWritePin(M3_EN, -speed);
                _lastM1Speed = speed;
            }
        }
        else if (m == Motor.M4) {
            if ((_lastM1Speed < 0) && (speed > 0) || (_lastM1Speed > 0) && (speed < 0)) {
                pcf8574x.writePinMode(M4_DIR, pcf8574x.Mode.High);
                pins.analogWritePin(M4_EN, speed);
                _lastM1Speed = speed;
            }
            if (speed >= 0) {
                pcf8574x.writePinMode(M4_DIR, pcf8574x.Mode.High);
                pins.analogWritePin(M4_EN, speed);
                _lastM1Speed = speed;
            }
            else {
                pcf8574x.writePinMode(M4_DIR, pcf8574x.Mode.Low);
                pins.analogWritePin(M4_EN, -speed);
                _lastM1Speed = speed;
            }
        }
    }

    /**
     * break niko
     */
    //% blockId=brakeNiko block="brake niko"
    //% weight=95
    //% blockGap=50
    export function brakeNiko() {
        pins.analogWritePin(M1_EN, 0);
        pins.analogWritePin(M2_EN, 0);
        pins.analogWritePin(M3_EN, 0);
        pins.analogWritePin(M4_EN, 0);
        pcf8574x.writePinMode(MOTOR_BRK, pcf8574x.Mode.High);
        basic.pause(10);
    }

    /**
     * set machine gun state
     * @param {boolean} state - true fire, false hold fire
     */
    //% blockId=setMachineGunState block="set machine gun shoot $state"
    //% state.defl=false
    //% weight=98
    export function setMachineGunState(state: boolean) {
        if (state == true) {
            pcf8574x.writePinMode(GUN_EN, pcf8574x.Mode.High);
        }
        else {
            pcf8574x.writePinMode(GUN_EN, pcf8574x.Mode.Low);
        }
    }

    /**
     * set niko go
     * @param {Directivon} dir - directivon to go
     * @param {number} speed - go speed
     */
    //% blockId=setNikoGo block="set niko go %dir speed as %speed"
    //% speed.min=-1023 speed.max=1023
    //% speed.defl=0
    //% weight=99
    export function setNikoGo(dir: Direction, speed: number) {
        if (dir == Direction.Forward) {
            setMotorSpeed(Motor.M1, speed);
            setMotorSpeed(Motor.M2, speed);
            setMotorSpeed(Motor.M3, speed);
            setMotorSpeed(Motor.M4, speed);
        }
        else if (dir == Direction.Backward) {
            setMotorSpeed(Motor.M1, -speed);
            setMotorSpeed(Motor.M2, -speed);
            setMotorSpeed(Motor.M3, -speed);
            setMotorSpeed(Motor.M4, -speed);
        }
        else if (dir == Direction.Left) {
            setMotorSpeed(Motor.M1, speed);
            setMotorSpeed(Motor.M2, -speed);
            setMotorSpeed(Motor.M3, speed);
            setMotorSpeed(Motor.M4, -speed);
        }
        else if (dir == Direction.Right) {
            setMotorSpeed(Motor.M1, -speed);
            setMotorSpeed(Motor.M2, speed);
            setMotorSpeed(Motor.M3, -speed);
            setMotorSpeed(Motor.M4, speed);
        }
        else if (dir == Direction.Clockwise) {
            setMotorSpeed(Motor.M1, speed);
            setMotorSpeed(Motor.M2, speed);
            setMotorSpeed(Motor.M3, -speed);
            setMotorSpeed(Motor.M4, -speed);
        }
        else if (dir == Direction.AntiClockwise) {
            setMotorSpeed(Motor.M1, -speed);
            setMotorSpeed(Motor.M2, -speed);
            setMotorSpeed(Motor.M3, speed);
            setMotorSpeed(Motor.M4, speed);
        }
    }

    /**
     * set servo
     * @param {AnalogPin} pin - servo pin 
     * @param {number} angle - servo angle
     */
    //% blockId=setServo block="set servo pin $pin angle as $angle"
    //% angle.min=0 angle.max=180
    //% angle.defl=90
    //% weight=97
    export function setServo(pin: AnalogPin, angle: number) {
        pins.servoWritePin(pin, angle);
    }

    /**
     * Initialize ps2 controller and set pins, should run at first
     */
    //% blockId=initPS2 block="initialize ps2 controller"
    function initPS2() {
        ps2.initGamepad(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13, DigitalPin.P16);
    }

    /**
     * read data from ps2 controller 
     */
    //% blockId=readPS2 block="read data from ps2 controller"
    export function readPS2() {
        ps2.readGamepad();
    }

    /**
     * calculate ps2 controller's digital button's state.
     * @param {DigitalButton} button - digital button name, eg: ps2.DigitalButton.Select
     * @return {boolean} digital button's state
     */
    //% blockId=calcPS2ButtonDigital block="calculate digital button"
    export function ps2ButtonDigital(button: ps2.DigitalButton): boolean {
        return ps2.buttonDigital(button);
    }

    /**
     * calculate ps2 controller's digital button's state.
     * @param {DigitalButton} button - digital button name, eg: ps2.DigitalButton.Select
     * @return {number} digital button's state
     */
    //% blockId=calcPS2ButtonAnalog block="calculate analog button"
    export function ps2ButtonAnalog(button: ps2.AnalogButton): number {
        return ps2.buttonAnalog(button);
    }

}