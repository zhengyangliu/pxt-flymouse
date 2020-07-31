/**
* StormScience flymouse robot package
* @author ArthurZheng
*/
//% weight=10 icon="\uf135" color=#2896ff
//% groups=['Basic', 'PS2', 'Motion', 'Sensor', 'others']
namespace flymouse {

    export enum Color {
        //% block=Red
        Red = 0xFF0000,
        //% block=Orange
        Orange = 0xFFA500,
        //% block=Yellow
        Yellow = 0xFFFF00,
        //% block=Green
        Green = 0x00FF00,
        //% block=Blue
        Blue = 0x0000FF,
        //% block=Indigo
        Indigo = 0x4b0082,
        //% block=Violet
        Violet = 0x8a2be2,
        //% block=Purple
        Purple = 0xFF00FF,
        //% block=White
        White = 0xFFFFFF,
        //% block=Black
        Black = 0x000000
    }

    export enum Rgbled {
        //% block="LED1"
        LED1 = 0x01,
        //% block="LED2"
        LED2 = 0x02,
        //% block="LED3"
        LED3 = 0x03,
        //% block="LED4"
        LED4 = 0x04,
    }

    export enum IRsensor {
        //% block="IR1"
        IR1 = 0x01,
        //% block="IR2"
        IR2 = 0x02,
        //% block="IR3"
        IR3 = 0x03,
        //% block="IR4"
        IR4 = 0x04,
        //% block="IR5"
        IR5 = 0x05,
        //% block="IR6"
        IR6 = 0x06,
    }

    export enum LedState {
        //% block="OFF"
        OFF = 0x00,
        //% block="ON"
        ON = 0x01,
    }

    export enum Motor {
        //% block="M1"
        M1 = 0x00,
        //% block="M2"
        M2 = 0x01,
    }

    export enum RGB {
        //% block="R"
        R = 0x00,
        //% block="G"
        G = 0x01,
        //% block="B"
        B = 0x02,
    }

    // fly mouse bottom board i2c address
    const I2C_ADDR = 0xA0 >> 1;

    /**
     * I2C protocol 
     */
    /* bit0 - write/read */
    const PROTOCOL_READ = 0x80
    const PROTOCOL_WRITE = 0x81
    const PROTOCOL_OLED = 0x82

    /* bit1 - read function */
    const PROTOCOL_RD_TEST = 0x00
    const PROTOCOL_RD_IR1 = 0x01
    const PROTOCOL_RD_IR2 = 0x02
    const PROTOCOL_RD_IR3 = 0x03
    const PROTOCOL_RD_IR4 = 0x04
    const PROTOCOL_RD_IR5 = 0x05
    const PROTOCOL_RD_IR6 = 0x06
    const PROTOCOL_RD_BATT = 0x07
    const PROTOCOL_RD_SOUND = 0x08
    const PROTOCOL_RD_LIGHT = 0x09
    const PROTOCOL_RD_TOUCH = 0x0A
    const PROTOCOL_RD_COLOR = 0x0B
    const PROTOCOL_RD_ENCODE1 = 0x0C
    const PROTOCOL_RD_ENCODE2 = 0x0D
    const PROTOCOL_RD_ULTRASONIC = 0x0E
    const PROTOCOL_RD_PWKEY = 0x0F

    /* bit1 - write function */
    const PROTOCOL_WR_LIGHT1 = 0x00
    const PROTOCOL_WR_LIGHT2 = 0x01
    const PROTOCOL_WR_LIGHT3 = 0x02
    const PROTOCOL_WR_LIGHT4 = 0x03
    const PROTOCOL_WR_MOTOR1 = 0x04
    const PROTOCOL_WR_MOTOR2 = 0x05
    const PROTOCOL_WR_MOTOR_BRK = 0x06
    const PROTOCOL_WR_TCS_CALI = 0x07     // TCS3200校准
    const PROTOCOL_WR_TCS_LED = 0x08
    const PROTOCOL_WR_CLR_ENCODE = 0x09

    const PROTOCOL_I2C_DATA_MAX_LEN = 18
    const PROTOCOL_RD_TEST_REP = 0xCA

    let _last_i2c_cmd_time = 0;
    let _last_oled_cmd_time = 0;

    const I2C_CMD_MIN_INTERVAL = 1; // 1ms
    const OLED_CMD_MIN_INTERVAL = 50; // 50ms

    let _last_M1_speed = 0;
    let _last_M2_speed = 0;

    // 电机速度换向后刹车时长
    const DIR_CHANGE_BRK_TIME = 10;

    const ENCODER_BASE_PULSE = 7;
    const MOTOR_DECELERATION_RATIO = 30;

    /**
     * start a protocol command with time pulse check
     * This funciton can provide Too fast command interval
     */
    function protocolCmd_start(cmd: number) {

        let temp = input.runningTime() - _last_i2c_cmd_time;

        if (temp < I2C_CMD_MIN_INTERVAL) {  //waited too short
            control.waitMicros(I2C_CMD_MIN_INTERVAL - temp);
        }

        _last_i2c_cmd_time = input.runningTime();

        pins.i2cWriteNumber(I2C_ADDR, cmd, NumberFormat.UInt8LE, false);
    }

    /**
     * check whether i2c communication is ok
     * @return {boolean} true ok, false nok
     */
    function checkI2c(): boolean {

        protocolCmd_start(PROTOCOL_READ);
        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_TEST, NumberFormat.UInt8LE, false);
        let rep = pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt8LE, false);

        if (rep == PROTOCOL_RD_TEST_REP) {
            return true;
        }
        else {
            return false;
        }
    }

    //% blockId=initFlymouse block="initialise fly mouse"
    //% weight=100
    //% blockGap=50
    //% group="Basic"
    export function initFlymouse() {

        initPS2();

        while (checkI2c() != true) {
            basic.pause(200)
        }

        setPixelColor(Rgbled.LED1, Color.Black);
        setPixelColor(Rgbled.LED2, Color.Black);
        setPixelColor(Rgbled.LED3, Color.Black);
        setPixelColor(Rgbled.LED4, Color.Black);

        setMotorbreak();

        setFilllight(flymouse.LedState.OFF);

        writeOLED(" ")
        writeOLED("+----------------+");
        writeOLED("| Microbit Onine |");
        writeOLED("+----------------+");
        writeOLED("ID " + control.deviceSerialNumber())
    }

    /**
     * configure the led by color
     * @param {number} offset - sequence number of the led
     * @param {Color} color - color
     */
    //% group="Basic"
    //% blockId=setPixelColor block="set led pixel %led color %color"
    export function setPixelColor(led: Rgbled, color: Color) {

        setPixelRGB(led, ((color & 0xff0000) >> 16), ((color & 0x00ff00) >> 8), (color & 0x0000ff));
    }

    /**
     * configure the led by RGB value
     * @param {number} offset - sequence number of the led
     * @param {number} red - the brightness of red
     * @param {number} green - the brightness of green
     * @param {number} blue - the brightness of blue
     */
    //% blockId=setPixelRGB block="set led pixel %led r %red g %green b %blue"
    //% inlineInputMode=inline
    //% red.min=0 red.max=255
    //% green.min=0 green.max=255
    //% blue.min=0 blue.max=255
    //% group="Basic"
    export function setPixelRGB(led: Rgbled, red: number, green: number, blue: number) {

        let bufr = pins.createBuffer(3);
        bufr.setNumber(NumberFormat.UInt8LE, 2, red);
        bufr.setNumber(NumberFormat.UInt8LE, 1, green);
        bufr.setNumber(NumberFormat.UInt8LE, 0, blue);

        protocolCmd_start(PROTOCOL_WRITE);

        if (led == Rgbled.LED1) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_LIGHT1, NumberFormat.UInt8LE, false);
        }
        else if (led == Rgbled.LED2) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_LIGHT2, NumberFormat.UInt8LE, false);
        }
        else if (led == Rgbled.LED3) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_LIGHT3, NumberFormat.UInt8LE, false);
        }
        else {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_LIGHT4, NumberFormat.UInt8LE, false);
        }

        pins.i2cWriteBuffer(I2C_ADDR, bufr);
    }

    //% blockId=writeOLED block="oled write string %str"
    //% group="Basic"
    export function writeOLED(str: string) {

        // 当指令间隔小于 OLED_CMD_MIN_INTERVAL
        while ((input.runningTime() - _last_oled_cmd_time) < OLED_CMD_MIN_INTERVAL) {
            control.waitMicros(20);
        }
        _last_oled_cmd_time = input.runningTime();

        // 限制最大字符串打印长度
        if (str.length > PROTOCOL_I2C_DATA_MAX_LEN) {
            str = str.slice(0, 18)
        }

        let bufr = pins.createBuffer(str.length);
        for (let i = 0; i < str.length; i++) {
            bufr.setNumber(NumberFormat.UInt8LE, i, str.charCodeAt(i))
        }
        protocolCmd_start(PROTOCOL_OLED);
        pins.i2cWriteNumber(I2C_ADDR, str.length, NumberFormat.UInt8LE, false);
        pins.i2cWriteBuffer(I2C_ADDR, bufr);
    }

    //% blockId=writeOLEDnumber block="oled write number %str = %num"
    //% group="Basic"
    export function writeOLEDnumber(str: string, num: number) {
        writeOLED(str + '=' + num.toString());
    }

    /**
     * read touch sensor
     * @return {boolean} 
     */
    //% blockId=readTouchsensor block="read touch sensor"
    //% group="Sensor"
    export function readTouchsensor(): boolean {

        protocolCmd_start(PROTOCOL_READ);

        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_TOUCH, NumberFormat.UInt8LE, false);

        let tmp = pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt8LE, false);

        if (tmp == 1) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * read ir sensors
     * @param {IRsensor}  ir - sequence number of ir sensors
     * @return {number} 0 ~ 4095, biger means closer
     */
    //% group="Sensor"
    //% weight=200
    //% blockId=readIRsensor block="read infrared sensor %ir"
    export function readIRsensor(ir: IRsensor): number {

        protocolCmd_start(PROTOCOL_READ);

        if (ir == IRsensor.IR1) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_IR1, NumberFormat.UInt8LE, false);
        }
        else if (ir == IRsensor.IR2) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_IR2, NumberFormat.UInt8LE, false);
        }
        else if (ir == IRsensor.IR3) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_IR3, NumberFormat.UInt8LE, false);
        }
        else if (ir == IRsensor.IR4) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_IR4, NumberFormat.UInt8LE, false);
        }
        else if (ir == IRsensor.IR5) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_IR5, NumberFormat.UInt8LE, false);
        }
        else if (ir == IRsensor.IR6) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_IR6, NumberFormat.UInt8LE, false);
        }

        return 0xfff - pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt16LE, false);
    }

    /**
     * read ultrasonic sensor
     * @return {boolean} 
     */
    //% blockId=readUltrasonicsensor block="read ultrasonic sensor"
    //% group="Sensor"
    export function readUltrasonicsensor(): number {

        protocolCmd_start(PROTOCOL_READ);

        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_ULTRASONIC, NumberFormat.UInt8LE, false);

        return pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt16LE, false);
    }

    /**
     * read sound sensor
     * @return {number} 0 ~ 4095, bigger means closer
     */
    //% blockId=readSoundsensor block="read sound sensor"
    //% group="Sensor"
    export function readSoundsensor(): number {

        protocolCmd_start(PROTOCOL_READ);

        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_SOUND, NumberFormat.UInt8LE, false);

        return 0xfff - pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt16LE, false);
    }

    /**
     * read light sensor
     * @return {number} 0 ~ 4095, bigger means lighter
     */
    //% blockId=readLightsensor block="read light sensor"
    //% group="Sensor"
    //% blockGap=50
    export function readLightsensor(): number {

        protocolCmd_start(PROTOCOL_READ);

        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_LIGHT, NumberFormat.UInt8LE, false);

        return 0xfff - pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt16LE, false);
    }

    /**
     * read battery volt
     * @return {nubmer} battery volt
     */
    //% blockId=readBatteryvolt block="read battery volt"
    //% advanced=true
    export function readBatteryvolt(): number {

        protocolCmd_start(PROTOCOL_READ);

        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_BATT, NumberFormat.UInt8LE, false);

        return pins.i2cReadNumber(I2C_ADDR, NumberFormat.Float32LE, false);
    }

    /**
     * read power key
     * @return {boolean} power key state
     */
    //% blockId=readPowerkey block="read power key"
    //% advanced=true
    export function readPowerkey(): boolean {

        protocolCmd_start(PROTOCOL_READ);

        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_PWKEY, NumberFormat.UInt8LE, false);

        let tmp = pins.i2cReadNumber(I2C_ADDR, NumberFormat.UInt8LE, false);

        if (tmp == 1) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * set fill light state
     * @param {LedState} state - fill light state
     */
    //% blockId=setFilllight block="set color sensor fill light state %state"
    //% group="Sensor"
    export function setFilllight(state: LedState) {

        protocolCmd_start(PROTOCOL_WRITE);
        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_TCS_LED, NumberFormat.UInt8LE, false);

        if (state == LedState.OFF) {
            pins.i2cWriteNumber(I2C_ADDR, 0, NumberFormat.UInt8LE, false);
        }
        else {
            pins.i2cWriteNumber(I2C_ADDR, 1, NumberFormat.UInt8LE, false);
        }
    }

    /**
     * calibrate color sensor white balance
     */
    //% blockId=calibrateColorsensor block="calibrate color sensor"
    //% group="Sensor"
    export function calibrateColorsensor() {

        protocolCmd_start(PROTOCOL_WRITE);
        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_TCS_CALI, NumberFormat.UInt8LE, false);
        pins.i2cWriteNumber(I2C_ADDR, 1, NumberFormat.UInt8LE, false);
        basic.pause(200);
    }

    /**
     * read color sensor
     * @return {number} rgb data
     */
    //% blockId=readColorsensor block="read color sensor RGB"
    //% group="Sensor"
    export function readColorsensor() {

        protocolCmd_start(PROTOCOL_READ);

        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_COLOR, NumberFormat.UInt8LE, false);

        let bufr = pins.i2cReadBuffer(I2C_ADDR, 3, false);

        return (bufr.getUint8(2) << 16) + (bufr.getUint8(1) << 8) + bufr.getUint8(0);
    }

    /**
     * calculate rgb data
     * @param {number} data - R+G+B data
     * @return {RGB} rgb - color want to calculate
     */
    //% blockId=calcRGB block="calculate color %rgb from RGB data %data"
    //% group="Sensor"
    export function calcRGB(rgb: RGB, data: number) {
        if (rgb == RGB.R) {
            return ((data >> 16) & 0xff);
        }
        else if (rgb == RGB.G) {
            return ((data >> 8) & 0xff);
        }
        else {
            return (data & 0xff);
        }
    }

    /**
     * set motor speed
     * @param {Motor} motor - sequence number of motor
     * @param {number} speed - motor speed -1023~1023
     */
    //% blockId=setMotorspeed block="set motor %motor speed %speed"
    //% inlineInputMode=inline
    //% speed.min=-1023 speed.max=1023
    //% group="Motion"
    export function setMotorspeed(motor: Motor, speed: number) {

        // 限幅输入参数
        if (speed > 1023) {
            speed = 1023;
        }
        else if (speed < -1023) {
            speed = -1023;
        }

        if (motor == Motor.M1) {
            // 电机换向时先简短刹车一定时间，防止电机电流激增
            if ((speed > 0) && (_last_M1_speed < 0) || (speed < 0) && (_last_M1_speed > 0)) {
                setMotorbreak();
                basic.pause(DIR_CHANGE_BRK_TIME);
            }

            protocolCmd_start(PROTOCOL_WRITE);
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_MOTOR1, NumberFormat.UInt8LE, false);
            _last_M1_speed = speed;
        }
        else {
            if ((speed > 0) && (_last_M2_speed < 0) || (speed < 0) && (_last_M2_speed > 0)) {
                setMotorbreak();
                basic.pause(DIR_CHANGE_BRK_TIME);
            }
            protocolCmd_start(PROTOCOL_WRITE);
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_MOTOR2, NumberFormat.UInt8LE, false);
            _last_M2_speed = speed;
        }
        pins.i2cWriteNumber(I2C_ADDR, speed, NumberFormat.Int16LE, false);
    }

    /**
     * set motor break
     */
    //% blockId=setMotorbreak block="set motor break"
    //% group="Motion"
    export function setMotorbreak() {
        protocolCmd_start(PROTOCOL_WRITE);
        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_MOTOR_BRK, NumberFormat.UInt8LE, false);
        pins.i2cWriteNumber(I2C_ADDR, 1, NumberFormat.UInt8LE, false);
    }

    /**
     * read turns of wheel encoder
     * @param {Motor}  encoder - sequence number of encoders
     * @return {number} number of wheel's turns
     * @note if number of pulse over 0xffff/2 ,the data will be error
     */
    //% blockId=readEncoder block="read turns of wheel encoder %encoder"
    //% group="Motion"
    export function readTurnsofwheel(encoder: Motor): number {

        protocolCmd_start(PROTOCOL_READ);

        if (encoder == Motor.M1) {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_ENCODE1, NumberFormat.Int8LE, false);
        }
        else {
            pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_RD_ENCODE2, NumberFormat.UInt8LE, false);
        }

        let count = pins.i2cReadNumber(I2C_ADDR, NumberFormat.Int32LE, false);

        return count / (ENCODER_BASE_PULSE * MOTOR_DECELERATION_RATIO);
    }

    /**
     * reset encoders
     */
    //% blockId=resetEncoder block="reset encoders"
    //% group="Motion"
    export function resetEncoder() {

        protocolCmd_start(PROTOCOL_WRITE);
        pins.i2cWriteNumber(I2C_ADDR, PROTOCOL_WR_CLR_ENCODE, NumberFormat.UInt8LE, false);
        pins.i2cWriteNumber(I2C_ADDR, 1, NumberFormat.UInt8LE, false);
    }

    /**
     * Initialize ps2 controller and set pins, should run at first.
     */
    function initPS2() {
        ps2.initGamepad(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13, DigitalPin.P16);
    }

    /**
     * read data from ps2 controller 
     */
    //% blockId=readPS2 block="read data from ps2 controller"
    //% group="PS2"
    export function readPS2() {
        if (ps2.readGamepad() == false)
            serial.writeString("ps2 x")
    }

    /**
     * calculate ps2 controller's digital button's state.
     * @param {DigitalButton} button - digital button name, eg: ps2.DigitalButton.Select
     * @return {boolean} digital button's state
     */
    //% blockId=calcPS2ButtonDigital block="read digital button %button from ps2 data"
    //% group="PS2"
    export function ps2ButtonDigital(button: ps2.DigitalButton): boolean {
        return ps2.buttonDigital(button);
    }

    /**
     * calculate ps2 controller's digital button's state.
     * @param {DigitalButton} button - digital button name, eg: ps2.DigitalButton.Select
     * @return {number} digital button's state
     */
    //% blockId=calcPS2ButtonAnalog block="read analog button %button from ps2 data"
    //% group="PS2"
    export function ps2ButtonAnalog(button: ps2.AnalogButton): number {
        return ps2.buttonAnalog(button);
    }
}