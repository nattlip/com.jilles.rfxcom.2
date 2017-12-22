"use strict";



const util = require('util');
const fs = require('fs');
const stream = require("stream");
const path = require('path');

const convert = require('../../baseConverter.js').jan.ConvertBase;
const helpFunctions = require('../../helpFunctions.js').jan;
const libClass = require('../../libClass.js')
const libNew = require('../../lib.js')

const driverTEMPHUMBAR = "todo" //require('../../../drivers/TEMPHUMBAR/driver.js');
const driverTEMP = "todo" //require('../../../drivers/TEMP/driver.js');
//const driverTEMPHUM = "todo" //require('../../../drivers/TEMPHUM/driver.js');
const driverRAIN = "todo" //require('../../../drivers/RAIN/driver.js');
const driverUV = "todo" //require('../../../drivers/UV/driver.js');



const eol = ' \n'
const eolf = ' \n\r'

const Homey = require('homey');
const driverTEMPHUM = Homey.ManagerDrivers.getDriver('TEMPHUM')

class oregondecoding extends libNew {

    constructor() {

        super()

        this.filename = path.basename(__filename)
        this.dirname = path.basename(__dirname);
         this.lib = new libClass();
        this.lib.log = this.lib.log.bind(this);
        this.debug = false;
        ;//  to set debug on or off 
        this.lib.log(` ${this.constructor.name}  is this. `);






        this.dataLayouts = {
            'TH1': {
                len: 2,
                data: {
                    temperature: { tag: 'rfxcomtemp' },
                    humidity: { tag: 'rfxcomhumidity' },
                    unknown: { start: 6, len: 1 }
                }
            },
            'T1': {
                len: 4,
                data: {
                    temperature: { tag: 'rfxcomtemp' },
                    sign: { start: 3, len: 1 }
                }
            },
            'UV1': {
                len: 4,
                data: {
                    uvindex: { start: 0, len: 2 },
                    unknown: { start: 2, len: 2 }
                }
            },
            'UV2': {
                len: 5,
                data: {
                    unknown: { start: 0, len: 3 },
                    uvindex: { start: 3, len: 2 }
                }
            },
            'W1': {
                len: 9,
                data: {
                    direction: { start: 0, len: 1, enc: 'bin' },
                    unknown: { start: 1, len: 2 },
                    currentspeed: { start: 3, len: 3, div: 10 },
                    averagespeed: { start: 6, len: 3, div: 10 }
                }
            },
            'R1': {
                len: 10,
                data: {
                    rainrate: { start: 0, len: 4, div: 100 },  // 0.01 inch/hr
                    raintotal: { start: 4, len: 6, div: 1000 } // 0.001 inch
                }
            },
            'R2': {
                len: 8,
                data: {
                    rainrate: { start: 0, len: 4, div: 10 },   // 0.1 mm/hr
                    raintotal: { start: 4, len: 4, div: 10 }  // 0.1 mm
                }
            },
            'THB'  : {
                len: 9, // 11 ?
                data: {
                    temperature: { tag: 'rfxcomtemp' },
                    humidity: { tag: 'rfxcomhumidity' },
                    comfort: {
                        start: 6, len: 1, map:
                        { 0: 'Normal', 4: 'Comfortable', 8: 'Dry', c: 'Wet' }
                    },
                    pressure: {tag: 'rfxcompressure'}, // mbar
                    forecast: {
                        start: 9, len: 1, map:
                        { 2: 'Cloudy', 3: 'Rainy', 6: 'Partly cloudy', c: 'Sunny' }
                    }
                }
            }
        }

        this.knownSensors = {
            '1984': { name: 'WGR800', layout: 'W1' },
            '1994': { name: 'WGR800', layout: 'W1' },
            '1d20': { name: 'THGN123N/THGR122NX', layout: 'TH1' },
            '1a2d': { name: 'THGR228N/THGN132N/THGR918/THGR928/THGRN228/THGN500' },
            'e2cf': { name: 'THGR333/THGN228NX', layout: 'TH1' },   // deze is het // kleine in corona
            '1d30': { name: 'THGN500', layout: 'TH1' },
            '1a3d': { name: 'THGR918' },
            '2914': { name: 'PCR800', layout: 'R1' },
            '2a1d': { name: 'RGR918' },
            '2d10': { name: 'RGR968', layout: 'R2' },
            '3a0d': { name: 'STR918/WGR918' },
            '5a5d': { name: 'BTHR918' },
            '5d60': { name: 'BTHR968/BTHR 918N', layout: 'THB' },
            'c844': { name: 'THWR800', layout: 'T1' },
            'd874': { name: 'UVN800', layout: 'UV2' },
            'ec40': { name: 'THN132N/THR238NF', layout: 'T1' },
            'ea4c': { name: 'THWR288A' },
            'ec70': { name: 'UVR128', layout: 'UV1' },  //mijne in corona
            'f824': { name: 'THGN800/THGN801/THGR810', layout: 'TH1' },
            'f8b4': { name: 'THGR810', layout: 'TH1' }
        }

        let Sensors = {};

        

        // rxtxRfxcom starts this
        this.parseRXData = (Fdevice,dataHex) =>
        //http://stackoverflow.com/questions/3756880/best-way-to-get-two-nibbles-out-of-a-byte-in-javascript

        {
            
            // v2.1 first make bitcount even then extract all uneven bits, they are inverted copy of  message
            
            //// to check nan from result  in decodedata
            //if (version == 2) {
            //    let baroNibble1 = datastring.slice(64, 68);
            //    let baroNibble2 = datastring.slice(68, 72);
            //    let baroNibble3 = datastring.slice(72, 76);
            
            //    //convert.bin2hex(baroNibble3) = always 0xC
            //    let baroHex = convert.bin2hex(baroNibble2) + convert.bin2hex(baroNibble1);  // 27-08 changed 3and 1 
            //    this.lib.log('barohex  ', baroHex);
            //    let baroDec = convert.hex2dec(baroHex);
            //    this.lib.log('baroDex  ', baroDec);
            //    let barometerdec = parseInt(baroDec) + 856;
            //    this.lib.log('barometer JIIIIIIIIIIIIIIIIl  ', barometerdec);



            this.lib.log('     entered parseRXData     ');

            // Decode the data part
            let deviceAndValues  = this.decodeData(Fdevice, dataHex)

            this.result = deviceAndValues.values
            
           
            this.lib.log('  oregondecoding result      ', util.inspect(this.result, false, null));
            if (typeof this.result != 'string') {
                // Now we have all elements for the unique Fdevice ID
                // Note: from user perspective it is nicer not to include the
                //       rollingCode, as this changes when replacing batteries.
               let uniqueId = this.result.id + ':' + this.result.channel + ':' + this.result.rolling;

                if (Sensors[uniqueId] == null) {
                    Sensors[uniqueId] = {};
                    this.lib.log('Found a new sensor. Total found is now', (Object.keys(Sensors).length));
                }
                // TODO: update only if needed and send an event
                // TODO: add comfort and forecast as custom capability
                let newdata = false;
                for (let r in this.result) {
                    if (this.result[r] != Sensors[uniqueId][r]) {
                        newdata = true;
                    }
                }
                this.lib.log('Sensor value has changed:', newdata);

                // Add additional data
                this.result.lastupdate = new Date();
                this.result.count = (Sensors[uniqueId].count || 0) + 1;
                this.result.newdata = newdata;
                // Update the sensor log
                Sensors[uniqueId] = this.result;
                // this.lib.log(Sensors);

                // jilles goto makeHomeyDriverCompatibleAandPasstoDriver(result)
                makeHomeyDriverCompatibleAandPasstoDriver(deviceAndValues.device, this.result)
            }  // decodedatapart

            /*
               Start Jilles code
            */

            
          









        }; //parserxdata
        // datahex is a string
        this.decodeData = (Fdevice,dataHex) => {

            // 5A6D 5d60  
            // 1A2D 1d20
            // FA24 f824
            // EA7C ec70

            let idHex = dataHex.slice(2, 6)
            let id = ''

            if (idHex == '1a2d')
                id = '1d20'
            if (idHex == '5a6d')
                id = '5d60'
            if (idHex == '1a3d')
                id = '1d30'
            if (idHex == 'fa28')
                id = 'e2cf'
            if (idHex == 'ea4c')
                (id = 'ec40')
            if (idHex == 'ea7c')
                (id = 'ec70')
              

            //hex 1 bin      0001       hex   1       bin 0001
            //    a          1010       hex   d           1101  
            //    2          0010             2           0010
            //    d          1101             0           0000        
            //    1
            //    0
            //    5
            //   id = ('0000' + dataHex.slice(2, 6)).slice(-4);
            this.lib.log('Device id hex rfxcom', id);  // 5d60  1d20
            let values = id;

            // unique id of snsor rollingcode
            let address = dataHex.slice(8, 10)

            this.lib.log('Device address  hex rfxcom', address)

            // temp

            //if(recbuf(6) And & H8) = 0 Then
            //celsius = CSng(Hex(recbuf(5))) + CSng(Hex(recbuf(4) >> 4)) / 10
            //Else
            //celsius = 0 - (CSng(Hex(recbuf(5))) + CSng(Hex(recbuf(4) >> 4)) / 10)
            //End If
            // recbuf slice = 2*recbuf + 2 ,2*recbuf + 4
            let celsius
            if ((parseInt(dataHex.slice(14, 16), 16) & 8) == 0)
            { celsius = parseInt(dataHex.slice(12, 14), 10) + (parseInt(dataHex.slice(10, 12), 16) >> 4) / 10 }
            else
            { celsius = 0 - (parseInt(dataHex.slice(12, 14), 10) + (parseInt(dataHex.slice(10, 12), 16) >> 4), 10) / 10 }

            this.lib.log('temp rfxcom ', celsius);

            let celsius2 = dataHex.slice(12, 13) + dataHex.slice(11, 12) + dataHex.slice(10, 11)

            this.lib.log('temp2 dsimpel  rfxcom ', celsius2);

            // " hum:" & VB.Right(      Hex(((recbuf(7) << 4) And &HF0) + ((recbuf(6) >> 4) And &HF))            , 2)

            let humidity = ''

            humidity = (((parseInt(dataHex.slice(16, 18), 16) << 4) & 0xf0) + ((parseInt(dataHex.slice(14, 16), 16) >> 4) & 0xF)).toString(16) // to string 6 makes 0x31 decimal 31

            this.lib.log('humidity rfxcom  rfxcom ', humidity);
            this.lib.log('humidity glbsal rfxcom  rfxcom ', wrhum(parseInt(dataHex.slice(16, 18), 16) & 0xc0));

            //WriteMessage(" baro:" & CStr(recbuf(8) + 856) & "hPa", False)

            let pressure

           pressure = Number(convert.hex2dec(dataHex.slice(18, 20))) + 856

            this.lib.log('baro rfxcom  rfxcom ', pressure)

            this.lib.log('channel  rfxcom   ', wrchannel(dataHex))

            checksum8(dataHex)






            // this.lib.log('sensor id layout ', util.inspect(knownSensors[id].layout, false, null));

            let layout = (this.knownSensors[id] != null ? this.knownSensors[id].layout : null);
            if (this.dataLayouts[layout] != null) {
                // Check the checksum before we start decoding
                let pos = 32 + 4 * this.dataLayouts[layout].len;
                let valid = calcChecksum(dataHex, pos);
                //  let valid = 2
                // Decode the values if the payload is valid
                // TODO valid is checked out
                if (valid || !valid) {                                           //first check if valid dataHex
                    this.lib.log('Sensor type:', this.knownSensors[id].name);

                    // Nibble 5 is the channel

                    this.lib.log('Channel number:', wrchannel(dataHex));

                    // Nibble 6 & 7 contain the rolling code

                    this.lib.log('Rolling code:', address);

                    // Nibble 8 contains the flags
                    // bit 2 (0x4) is the low battery indicator
                    let flagnibble = dataHex.slice(28, 32);
                    this.lib.log('Flag nibble:', flagnibble);

                    let lowbattery = flagnibble[1] == '1';
                    this.lib.log('Low battery:', lowbattery);

                    // Store the results so far
                    values = {
                        name: this.knownSensors[id].name,
                        layout: this.knownSensors[id].layout,
                        id: id,
                        channel: wrchannel(dataHex),
                        rolling: address,
                        lowbattery: lowbattery,
                        data: {}
                    };


                    for (let p in this.dataLayouts[layout].data) {
                        let value = 0;
                        let elem = this.dataLayouts[layout].data[p];

                        if (elem.tag == 'rfxcomtemp')
                        { value = celsius }
                        if (elem.tag == 'rfxcomhumidity')
                        { value = humidity }
                        if (elem.tag == 'rfxcompressure')
                        { value = pressure }



                        if (p == 'direction') {
                            value *= 22.5;
                        } else if (elem.map != null) {
                            value = elem.map[value] || 'Unknown';
                        } else if (p != 'unknown') {
                            value = Number(value);
                            if (elem.div != null) {
                                value /= elem.div;
                            }
                            if (elem.add != null) {
                                value += elem.add;
                            }
                        }
                        values.data[p] = value;
                        this.lib.log('dataHex > ' + p + ':', value);
                    }
                    if (values.data.sign != null) {
                        if (Number(values.data.sign) > 0) {
                            values.data.temperature *= -1;
                        }
                        delete (values.data.sign);
                    }
                } else {
                    this.lib.log('Checksum mismatch - ignoring message');
                }
            }  // datalayou = !null

            else {
                this.lib.log('Unknown sensor ID ' + id + '; ignoring...');
            }

            //  this.lib.log('values ', util.inspect(values, false, null));

            // added device

            let deviceAndValues = {device: Fdevice, values:values}

            return deviceAndValues



            //return values;

        }




        let wrchannel = (dataHex) => {
            let channel
            switch (parseInt(dataHex.slice(6, 8), 16) & 0x70) {
                case 0x10:
                    channel = 1
                    break
                case 0x20:
                    channel = 2
                    break
                case 0x40:
                    channel = 3
                    break
                default:
                    channel = 4
            }

            return channel



        }


        let wrhum = (hum) => {
            let wetness

            switch (hum) {
                case 0x0:
                    wetness = `Normal`
                    break
                case 0x40:
                    wetness = `Comfort`
                    break
                case 0x80:
                    wetness = `Dry`
                    break
                case 0x80:
                    wetness = `Wet`

            }

            return wetness

        }

        //Sub checksum8()
        //Dim cs As Short
        //cs = cs8()
        //cs = (cs - recbuf(8)) And & HFF
        //If cs <> 0 Then
        //WriteMessage(" Checksum Error", False)
        //End If
        //End Sub

        let checksum8 = (dataHex) => {
            let cs
            cs = cs8(dataHex)
            cs = (cs - parseInt(dataHex.slice(18, 20), 16)) & 0xff
            if (cs != 0) {
                this.lib.log(`checksum rfxcom    `, `Checksum Error`)
            }
            else {
                this.lib.log(`checksum rfxcom    `, `Checksum correct`)

            }


        }

        //Function cs8() As Byte
        //Dim cs As Byte
        //cs = (recbuf(0) >> 4 And & HF)
        //cs += (recbuf(1) >> 4 And & HF) + (recbuf(1) And & HF)
        //cs += (recbuf(2) >> 4 And & HF) + (recbuf(2) And & HF)
        //cs += (recbuf(3) >> 4 And & HF) + (recbuf(3) And & HF)
        //cs += (recbuf(4) >> 4 And & HF) + (recbuf(4) And & HF)
        //cs += (recbuf(5) >> 4 And & HF) + (recbuf(5) And & HF)
        //cs += (recbuf(6) >> 4 And & HF) + (recbuf(6) And & HF)
        //cs += (recbuf(7) >> 4 And & HF) + (recbuf(7) And & HF)
        //Return cs
        //End Function


        let cs8 = (dataHex) => {

            let cs

            cs = (parseInt(dataHex.slice(2, 4), 16) >> 4)
            cs += ((parseInt(dataHex.slice(4, 6), 16) >> 4) & 0xf0) + (parseInt(dataHex.slice(4, 6), 16) & 0xf0)
            cs += ((parseInt(dataHex.slice(6, 8), 16) >> 4) & 0xf0) + (parseInt(dataHex.slice(6, 8), 16) & 0xf0)
            cs += ((parseInt(dataHex.slice(8, 10), 16) >> 4) & 0xf0) + (parseInt(dataHex.slice(8, 10), 16) & 0xf0)
            cs += ((parseInt(dataHex.slice(10, 12), 16) >> 4) & 0xf0) + (parseInt(dataHex.slice(10, 12), 16) & 0xf0)
            cs += ((parseInt(dataHex.slice(12, 14), 16) >> 4) & 0xf0) + (parseInt(dataHex.slice(12, 14), 16) & 0xf0)
            cs += ((parseInt(dataHex.slice(14, 16), 16) >> 4) & 0xf0) + (parseInt(dataHex.slice(14, 16), 16) & 0xf0)
            cs += ((parseInt(dataHex.slice(16, 18), 16) >> 4) & 0xf0) + (parseInt(dataHex.slice(16, 18), 16) & 0xf0)

            return cs

        }





       let calcChecksum  = (data, end) => {
            let slice = data.slice(end + 4, end + 8) + data.slice(end, end + 4);
            this.lib.log(slice);
            let check = Number(convert.bin2dec(slice));
            this.lib.log('Read checksum: ' + check);
            let checksum = 0;
            for (let i = 0; i < end / 4; i++) {
                let nibble = data.slice(i * 4, i * 4 + 4);
                checksum += Number(convert.bin2dec(nibble));
            }
            this.lib.log('Calculated checksum: ' + checksum);
            return (checksum == check);
        }


        //#region choosedevice
        let makeHomeyDriverCompatibleAandPasstoDriver = (Fdevice, result) => {


            switch (result.id) {

                case "5d60":
                    processTEMPHUMBAR(Fdevice,result);
                    break;
                case "1d20":
                case "1d30":    // kleine corona THGN228NX
                case "e2cf":    // kleine corona THGN228NX
                    processTEMPHUM(Fdevice,result);
                    break;
                case "2914":  // regenmeter
                    processRAIN(Fdevice,result);
                    break;
                case "ec70":  // UV uv meter corona
                    processUV(Fdevice,result);
                    break;
                case "ec40":  // THN132n only temp c844
                case "c844":  // THN132n only temp c844
                    processTEMP(Fdevice,result);
            }

        }
        //#endregion




        let processTEMP = (Fdevice, result) => {

            let filledDevice = {
                data: {
                    protocol: Fdevice.data.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                    driver: 'TEMP',
                    type: 'T',           // type of device eg visonicdoorsensor
                    id: 'Lan' + result.id + result.rolling,             // homey id Homey.app.app + device.rx.type
                    houseCode: null,
                    unitCode: null,
                },
                rx: Fdevice.rx, // index of rxtx where signals are received from for this device
                tx: [], // index of rxtx where franes are send to for this device 
                
                name: Homey.app.app + Fdevice.rx.type + result.id + result.rolling,            //   rxtx type and old id 
                capabilities: ["measure_temperature", "alarm_battery"],
                capability: {
                    measure_temperature: parseFloat(parseFloat(result.data.temperature).toFixed(2)),
                    alarm_battery: result.lowbattery  // onoff dim temp etc as json  object of capabilities
                }

            }







            let oregonTEMPDevice =
                {
                    id: result.id + result.rolling,
                    SensorID: result.id,
                    channel: result.channel,
                    rollingCode: result.rolling,
                    battery: result.lowbattery,
                    temperature: parseFloat(parseFloat(result.data.temperature).toFixed(2)),
                };


            let homeyDevice =
                {
                    data: { id: oregonTEMPDevice.id },
                    name: oregonTEMPDevice.id,
                    capabilities: ["measure_temperature", "alarm_battery"],
                    measure_temperature: oregonTEMPDevice.temperature,
                    alarm_battery: oregonTEMPDevice.battery,
                };

            this.lib.log('temp device oregon ', filledDevice)


            if (!this.contains(driverTEMP.homeyDevices, homeyDevice)) {
                driverTEMP.homeyDevices.push(homeyDevice);
            } else {

                driverTEMP.updateCapabilitiesHomeyDevice(homeyDevice);
            }

        };  // end process

        let processTEMPHUM = (Fdevice, result) => {

          
            let id = 'lan' + result.id + result.rolling

            let filledDevice = {
                data: {
                    id: id,             // homey id  Homey.app.app + device.rx.type 
                    houseCode: null,
                    unitCode: null,
                },
                protocol: Fdevice.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                driver: 'TEMPHUM',
                type: 'TH',           // type of device eg visonicdoorsensor               
                name: 'Lan' + result.id + result.rolling, // Homey.app.app + device.rx.type
                rx: Fdevice.rx, // index of rxtx where signals are received from for this device
                tx: [], // index of rxtx where franes are send to for this device //   rxtx type and old id
                capabilities: ["measure_temperature", "measure_humidity", "alarm_battery"],
                capability: {
                    measure_temperature: parseFloat(parseFloat(result.data.temperature).toFixed(2)),
                    measure_humidity: parseInt(result.data.humidity),
                    alarm_battery: result.lowbattery  // onoff dim temp etc as json  object of capabilities
                }
            }




           


            this.lib.log('temphum device oregon ', filledDevice)



            if (!this.contains(driverTEMPHUM.homeyDevices, filledDevice)) {
                driverTEMPHUM.homeyDevices.push(filledDevice);
            } else {

                //this.lib.log('else devioce entered ')
                //this.lib.log('filleddevice data id  ', id)
                

                const device = driverTEMPHUM.getDevice(filledDevice.data);
               // this.lib.log('driver get devices  ', util.inspect(driverTEMPHUM.getDevices()))

                this.lib.log('instance of Homey.device ', device instanceof Homey.Device )
                if (device instanceof Homey.Device) {
                    Homey.app.log('orgeon decoding device is already registered')
                    driverTEMPHUM.log('device is already registered');
                    device.log(`device is already registered with  getData() ${util.inspect(device.getData())}  `)
                 //   device.updateCapabilitiesOregon(filledDevice)
                    // client.end();
                    // return callback(Error('duplicate'));
                }
            }
            //  TODO visonic homey 
        };  // end process

        let  processTEMPHUMBAR = (Fdevice,result) => {
            this.lib.log('  processTEMPHUMBAR(result) enterd  ');
            this.lib.log('temp ', result.data.temperature, typeof result.data.temperature)


            this.lib.log('pressure ', result.data.pressure, typeof result.data.pressure)

            let filledDevice = {
                data: { 
                    protocol: Fdevice.data.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                    driver: 'TEMPHUMBAR',
                    type: 'THB',           // type of Fdevice eg visonicdoorsensor
                    id: Homey.app.app + Fdevice.rx.type + result.id + result.rolling,             // homey id 
                    houseCode: null,
                    unitCode: null,
            },
                rx: Fdevice.rx, // index of rxtx where signals are received from for this device
                tx: [], // index of rxtx where franes are send to for this device 
                name: Homey.app.app + Fdevice.rx.type + result.id + result.rolling,            //   rxtx type and old id 
                capabilities: ["measure_temperature", "measure_humidity", "measure_pressure", "alarm_battery"],
                capability: {
                    measure_temperature: parseFloat(parseFloat(result.data.temperature).toFixed(2)),
                    measure_humidity: parseInt(result.data.humidity),
                    measure_pressure: parseInt(result.data.pressure),
                    alarm_battery: result.lowbattery  // onoff dim temp etc as json  object of capabilities
                }   
          
            }

            

            let oregonTEMPHUMBARDevice =
                {
                    id: result.id + result.rolling,
                    SensorID: result.id,
                    channel: result.channel,
                    rollingCode: result.rolling,
                    battery: result.lowbattery,
                    temperature: parseFloat(parseFloat(result.data.temperature).toFixed(2)),
                    humidity: parseInt(result.data.humidity),
                    pressure: parseInt(result.data.pressure),
                    forecast: result.data.forecast
                };


            let homeyDevice =
                {
                    data: { id: oregonTEMPHUMBARDevice.id },
                    name: oregonTEMPHUMBARDevice.id,
                    capabilities: ["measure_humidity", "measure_pressure", "measure_temperature", "alarm_battery"],
                    measure_temperature: oregonTEMPHUMBARDevice.temperature,
                    measure_humidity: oregonTEMPHUMBARDevice.humidity,
                    measure_pressure: oregonTEMPHUMBARDevice.pressure,
                    alarm_battery: oregonTEMPHUMBARDevice.battery,
                };




            //this.lib.log('temphumbar device oregon ', filledDevice)

            //if (!this.contains(driverTEMPHUMBAR.homeyDevices, homeyDevice)) {
            //    driverTEMPHUMBAR.homeyDevices.push(homeyDevice);
            //} else {

            //    driverTEMPHUMBAR.updateCapabilitiesHomeyDevice(homeyDevice);
            //}
            // return homeyDevices;

        } // end process

        let  processRAIN = (result) => {

            let oregonRAINDevice =
                {
                    id: result.id + result.rolling,
                    SensorID: result.id,
                    channel: result.channel,
                    rollingCode: result.rolling,
                    battery: result.lowbattery,
                    rain: result.data.rainrate,
                    raintotal: result.data.raintotal
                };


            let homeyDevice =
                {
                    data: { id: oregonRAINDevice.id },
                    name: oregonRAINDevice.id,
                    capabilities: ["measure_rain"],// ["measure_rain","measure_raintotal"],
                    measure_rain: oregonRAINDevice.rain,
                    alarm_battery: oregonRAINDevice.battery,
                };




            if (!this.contains(driverRAIN.homeyDevices, homeyDevice)) {
                driverRAIN.homeyDevices.push(homeyDevice);
            } else {

                driverRAIN.updateCapabilitiesHomeyDevice(homeyDevice);
            }

        };  // end device

        let processUV = (result)  => {

            let oregonUVDevice =
                {
                    id: result.id + result.rolling,
                    SensorID: result.id,
                    channel: result.channel,
                    rollingCode: result.rolling,
                    battery: result.lowbattery,
                    uvindex: result.data.uvindex,

                };


            let homeyDevice =
                {
                    data: { id: oregonUVDevice.id },
                    name: oregonUVDevice.id,
                    capabilities: ["measure_ultraviolet"],// ["measure_rain"],
                    measure_ultraviolet: oregonUVDevice.uvindex,
                    alarm_battery: oregonUVDevice.battery,
                };




            if (!this.contains(driverUV.homeyDevices, homeyDevice)) {
                driverUV.homeyDevices.push(homeyDevice);
            } else {

                driverUV.updateCapabilitiesHomeyDevice(homeyDevice);
            }

        };  // end device


        //end processdata




    } // end constructor

    //TODO ipmplement filleddevice, icorporate drivers in driver lib, make one device eith multiple capablities preventing duplicste code
    //TODO  after filled device is implemented remove it with device wihich is generated in rxtxcom 




} // end class

module.exports = new oregondecoding()