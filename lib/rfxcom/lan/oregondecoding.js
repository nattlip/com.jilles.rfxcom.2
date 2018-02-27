"use strict";



const util = require('util');
const fs = require('fs');
const stream = require("stream");
const path = require('path');

const convert = require('../../baseConverter.js').jan.ConvertBase;
const helpFunctions = require('../../helpFunctions.js').jan;
const libNew = require('../../lib.js')

const driverTEMPHUMBAR = "todo" //require('../../../drivers/TEMPHUMBAR/driver.js');
const driverTEMP = "todo" //require('../../../drivers/TEMP/driver.js');
//const driverTEMPHUM = "todo" //require('../../../drivers/TEMPHUM/driver.js');
const driverRAIN = "todo" //require('../../../drivers/RAIN/driver.js');
const driverUV = "todo" //require('../../../drivers/UV/driver.js');



const eol = ' \n'
const eolf = ' \n\r'

const Homey = require('homey');
const driverOregon = Homey.ManagerDrivers.getDriver('oregon')

class oregondecoding extends libNew {

    constructor() {

        super()

        this.filename = path.basename(__filename)
        this.dirname = path.basename(__dirname);
        this.debug = true;
        ;//  to set debug on or off 
        driverOregon.log(` ${this.constructor.name}  is this. `);






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
                  //  rainrate: { start: 0, len: 4, div: 10 },   // 0.1 mm/hr
                  //  raintotal: { start: 4, len: 4, div: 10 }  // 0.1 mm
                     rainrate: { tag : 'rfxcomrainrate' },   // 0.1 mm/hr
                     raintotal: { tag : 'rfxcomraintotal'  }  // 0.1 mm
                }
            },
            'THB': {
                len: 9, // 11 ?
                data: {
                    temperature: { tag: 'rfxcomtemp' },
                    humidity: { tag: 'rfxcomhumidity' },
                    comfort: {
                        start: 6, len: 1, map:
                        { 0: 'Normal', 4: 'Comfortable', 8: 'Dry', c: 'Wet' }
                    },
                    pressure: { tag: 'rfxcompressure' }, // mbar
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
            '5d53': { name: 'BTHGN129', layout: 'THB' },
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
        this.parseRXData = (filledDevice, dataHex) =>
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
            //    driverOregon.log('barohex  ', baroHex);
            //    let baroDec = convert.hex2dec(baroHex);
            //    driverOregon.log('baroDex  ', baroDec);
            //    let barometerdec = parseInt(baroDec) + 856;
            //    driverOregon.log('barometer JIIIIIIIIIIIIIIIIl  ', barometerdec);



            driverOregon.log('     entered parseRXData     ');

            // Decode the data part
            let deviceAndValues = this.decodeData(filledDevice, dataHex)

            this.result = deviceAndValues.values


            driverOregon.log('  oregondecoding result      ', util.inspect(this.result, false, null));
            if (typeof this.result != 'string') {
                // Now we have all elements for the unique                  filledDevice ID
                // Note: from user perspective it is nicer not to include the
                //       rollingCode, as this changes when replacing batteries.
                let uniqueId = this.result.id + ':' + this.result.channel + ':' + this.result.rolling;

                if (Sensors[uniqueId] == null) {
                    Sensors[uniqueId] = {};
                    driverOregon.log('Found a new sensor. Total found is now', (Object.keys(Sensors).length));
                }
                // TODO: update only if needed and send an event
                // TODO: add comfort and forecast as custom capability
                let newdata = false;
                for (let r in this.result) {
                    if (this.result[r] != Sensors[uniqueId][r]) {
                        newdata = true;
                    }
                }
                driverOregon.log('Sensor value has changed:', newdata);

                // Add additional data
                this.result.lastupdate = new Date();
                this.result.count = (Sensors[uniqueId].count || 0) + 1;
                this.result.newdata = newdata;
                // Update the sensor log
                Sensors[uniqueId] = this.result;
                // driverOregon.log(Sensors);

                // jilles goto makeHomeyDriverCompatibleAandPasstoDriver(result)
                makeHomeyDriverCompatibleAandPasstoDriver(deviceAndValues.device, this.result)
            }  // decodedatapart

            /*
               Start Jilles code
            */












        }; //parserxdata
        // datahex is a string
        this.decodeData = (filledDevice, dataHex) => {

            // 5A6D 5d60  
            // 1A2D 1d20
            // FA24 f824
            // EA7C ec70

            let idHex = dataHex.slice(2, 6)
            let id = ''
            driverOregon.log('idhex ', idHex);  // 5d60  1d20
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
            if (idHex == '5a5d')  
                (id = '5d53')
            if (idHex == '2a19') 
                (id = '2d10')

            //hex 1 bin      0001       hex   1       bin 0001
            //    a          1010       hex   d           1101  
            //    2          0010             2           0010
            //    d          1101             0           0000        
            //    1
            //    0
            //    5
            //   id = ('0000' + dataHex.slice(2, 6)).slice(-4);
            driverOregon.log('Device id hex rfxcom', id);  // 5d60  1d20
            let values = id;

            // unique id of snsor rollingcode
            let address = dataHex.slice(8, 10)

            driverOregon.log('Device address  hex rfxcom', address)

            // temp

            //if(recbuf(6) And & H8) = 0 Then
            //celsius = CSng(Hex(recbuf(5))) + CSng(Hex(recbuf(4) >> 4)) / 10
            //Else
            //celsius = 0 - (CSng(Hex(recbuf(5))) + CSng(Hex(recbuf(4) >> 4)) / 10)
            //End If
            // recbuf slice = 2*recbuf + 2 ,2*recbuf + 4
            let celsius
            if ((parseInt(dataHex.slice(14, 16), 16) & 8) == 0) { celsius = parseInt(dataHex.slice(12, 14), 10) + (parseInt(dataHex.slice(10, 12), 16) >> 4) / 10 }
            else { celsius = 0 - (parseInt(dataHex.slice(12, 14), 10) + (parseInt(dataHex.slice(10, 12), 16) >> 4), 10) / 10 }

            driverOregon.log('temp rfxcom ', celsius);

            let celsius2 = dataHex.slice(12, 13) + dataHex.slice(11, 12) + dataHex.slice(10, 11)

            driverOregon.log('temp2 dsimpel  rfxcom ', celsius2);

            // " hum:" & VB.Right(      Hex(((recbuf(7) << 4) And &HF0) + ((recbuf(6) >> 4) And &HF))            , 2)

            let humidity = ''

            humidity = (((parseInt(dataHex.slice(16, 18), 16) << 4) & 0xf0) + ((parseInt(dataHex.slice(14, 16), 16) >> 4) & 0xF)).toString(16) // to string 6 makes 0x31 decimal 31

            driverOregon.log('humidity rfxcom  rfxcom ', humidity);
            driverOregon.log('humidity glbsal rfxcom  rfxcom ', wrhum(parseInt(dataHex.slice(16, 18), 16) & 0xc0));

            //WriteMessage(" baro:" & CStr(recbuf(8) + 856) & "hPa", False)

            let pressure
            let addtopressure

            if (id == '5d53')
                pressure = Number(convert.hex2dec(dataHex.slice(18, 20))) + 811
            else
                pressure = Number(convert.hex2dec(dataHex.slice(18, 20))) + 856

            driverOregon.log('baro rfxcom  rfxcom ', pressure)

            driverOregon.log('channel  rfxcom   ', wrchannel(dataHex))


            let rainrate
            let raintotal

           // train = (CSng(Hex(recbuf(5))) / 10) + (CSng(Hex((recbuf(4) >> 4) And & HF)) / 100) + (CSng(Hex((recbuf(6) And & HF)))

            rainrate = Number((parseInt(dataHex.slice(12, 14), 10) / 10 + ((parseInt(dataHex.slice(10, 12), 16) >> 4) & 0xF) / 100 + (parseInt(dataHex.slice(14, 16), 16) & 0xF)/1000))
            

            rainrate = (rainrate * 25.4).toFixed(2) // inch to mm
            driverOregon.log('rainrate  ', rainrate)

           // train = (CSng(Hex(recbuf(7))) / 100 + CSng(Hex(recbuf(6) >> 4)) / 1000)
           // train = train + (CSng(Hex(recbuf(9) And & HF)) * 100 + CSng(Hex(recbuf(8))))

            raintotal = ((parseInt(dataHex.slice(16, 18), 10)) / 100) + ((parseInt(dataHex.slice(14, 16), 16) >> 4) / 1000)
            raintotal = raintotal + (parseInt((dataHex.slice(20, 22), 16) & 0xF))*100     +  (parseInt(dataHex.slice(18, 20), 10))
            raintotal = (raintotal * 25.4).toFixed(2)

            checksum8(dataHex)

            driverOregon.log('raintotal  ', raintotal)




            // driverOregon.log('sensor id layout ', util.inspect(knownSensors[id].layout, false, null));

            let layout = (this.knownSensors[id] != null ? this.knownSensors[id].layout : null);
            if (this.dataLayouts[layout] != null) {
                // Check the checksum before we start decoding
                let pos = 32 + 4 * this.dataLayouts[layout].len;
                let valid = calcChecksum(dataHex, pos);
                //  let valid = 2
                // Decode the values if the payload is valid
                // TODO valid is checked out
                if (valid || !valid) {                                           //first check if valid dataHex
                    driverOregon.log('Sensor type:', this.knownSensors[id].name);

                    // Nibble 5 is the channel

                    driverOregon.log('Channel number:', wrchannel(dataHex));

                    // Nibble 6 & 7 contain the rolling code

                    driverOregon.log('Rolling code:', address);

                    // Nibble 8 contains the flags
                    // bit 2 (0x4) is the low battery indicator
                    let flagnibble = dataHex.slice(28, 32);
                    driverOregon.log('Flag nibble:', flagnibble);

                    let lowbattery = flagnibble[1] == '1';
                    let lowbatteryNumber = Number(lowbattery)
                    driverOregon.log('Low battery:', lowbattery);

                    // Store the results so far
                    values = {
                        name: this.knownSensors[id].name,
                        layout: this.knownSensors[id].layout,
                        id: id,
                        channel: wrchannel(dataHex),
                        rolling: address,
                        lowbattery: lowbatteryNumber,
                        data: {}
                    };


                    for (let p in this.dataLayouts[layout].data) {
                        let value = 0;
                        let elem = this.dataLayouts[layout].data[p];

                        if (elem.tag == 'rfxcomtemp') { value = celsius }
                        if (elem.tag == 'rfxcomhumidity') { value = humidity }
                        if (elem.tag == 'rfxcompressure') { value = pressure }
                        if (elem.tag == 'rfxcomrainrate') { value = rainrate }
                        if (elem.tag == 'rfxcomraintotal') { value = raintotal }

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
                        driverOregon.log('dataHex > ' + p + ':', value);
                    }
                    if (values.data.sign != null) {
                        if (Number(values.data.sign) > 0) {
                            values.data.temperature *= -1;
                        }
                        delete (values.data.sign);
                    }
                } else {
                    driverOregon.log('Checksum mismatch - ignoring message');
                }
            }  // datalayou = !null

            else {
                driverOregon.log('Unknown sensor ID ' + id + '; ignoring...');
            }

            //  driverOregon.log('values ', util.inspect(values, false, null));

            // added device

            let deviceAndValues = { device: filledDevice, values: values }

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
                driverOregon.log(`checksum rfxcom    `, `Checksum Error`)
            }
            else {
                driverOregon.log(`checksum rfxcom    `, `Checksum correct`)

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





        let calcChecksum = (data, end) => {
            let slice = data.slice(end + 4, end + 8) + data.slice(end, end + 4);
            driverOregon.log(slice);
            let check = Number(convert.bin2dec(slice));
            driverOregon.log('Read checksum: ' + check);
            let checksum = 0;
            for (let i = 0; i < end / 4; i++) {
                let nibble = data.slice(i * 4, i * 4 + 4);
                checksum += Number(convert.bin2dec(nibble));
            }
            driverOregon.log('Calculated checksum: ' + checksum);
            return (checksum == check);
        }


        //#region choosedevice
        let makeHomeyDriverCompatibleAandPasstoDriver = (Fdevice, result) => {

            driverOregon.log(`processOregon filled device ${util.inspect(Fdevice)}`);
            // is not a homey capabilty but capabilities with value
            let capability = {}
            let capabilities = []
            
          
            driverOregon.log(`result.id     ${result.id}   `);
            
            let filledDevice = {}
            switch (result.id) {

                case "5d60":
                case "5d53":

                    Fdevice.data.type = 'THB'
                     filledDevice = {
                        data: {
                            id: result.id + result.rolling,             // homey id 
                            houseCode: 19,
                            unitCode: 19,
                            protocol: Fdevice.data.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                            type: Fdevice.data.type,           // type of                  Fdevice eg visonicdoorsensor

                        },
                        driver: 'oregon',
                        rx: Fdevice.rx, // index of rxtx where signals are received from for this device
                        tx: [], // index of rxtx where franes are send to for this device 
                        name: Fdevice.rx.type + result.id + result.rolling,            //   rxtx type and old id 
                        capabilities: Homey.app.rfxcomDeviceTypes[Fdevice.data.type].capabilities,
                        capability: {
                            measure_temperature: parseFloat(parseFloat(result.data.temperature).toFixed(2)),
                            measure_humidity: parseInt(result.data.humidity),
                            measure_pressure: parseInt(result.data.pressure),
                            measure_battery: result.lowbattery  // onoff dim temp etc as json  object of capabilities
                        },
                        icon: `/icons/${Fdevice.data.type}.svg`,
                        settings: { id: Fdevice.rx.type + Fdevice.data.type+ result.id + result.rolling }
                    }





                    driverOregon.log(`processOregon filled device ${util.inspect(filledDevice)}`);
                    this.processOregonDevice(filledDevice);

                    break;
                case "1d20":
                case "1d30":    // kleine corona THGN228NX
                case "e2cf":    // kleine corona THGN228NX
                    Fdevice.data.type = 'TH'
                    filledDevice = {
                        data: {
                            id: result.id + result.rolling,             // homey id 
                            houseCode: 17,
                            unitCode: 17,
                            protocol: Fdevice.data.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                            type: Fdevice.data.type,           // type of                  Fdevice eg visonicdoorsensor

                        },
                        driver: 'oregon',
                        rx: Fdevice.rx, // index of rxtx where signals are received from for this device
                        tx: [], // index of rxtx where franes are send to for this device 
                        name: Fdevice.rx.type + result.id + result.rolling,            //   rxtx type and old id 
                        capabilities: Homey.app.rfxcomDeviceTypes[Fdevice.data.type].capabilities,
                        capability: {
                            measure_temperature: parseFloat(parseFloat(result.data.temperature).toFixed(2)),
                            measure_humidity: parseInt(result.data.humidity),
                            measure_battery: result.lowbattery  // onoff dim temp etc as json  object of capabilities
                        },
                        icon: `/icons/${Fdevice.data.type}.svg`,
                        settings: { id: Fdevice.rx.type + Fdevice.data.type + result.id + result.rolling }
                    }

                    driverOregon.log(`processOregon filled device ${util.inspect(filledDevice)}`);
                    this.processOregonDevice(filledDevice);

                    break;
                case "2d10":  // regenmeter

                    Fdevice.data.type = `R`

                    filledDevice = {
                        data: {
                            id: result.id + result.rolling,             // homey id 
                            houseCode: 17,
                            unitCode: 17,
                            protocol: Fdevice.data.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                            type: Fdevice.data.type,           // type of                  Fdevice eg visonicdoorsensor

                        },
                        driver: 'oregon',
                        rx: Fdevice.rx, // index of rxtx where signals are received from for this device
                        tx: [], // index of rxtx where franes are send to for this device 
                        name: Fdevice.rx.type + result.id + result.rolling,            //   rxtx type and old id 
                        capabilities: Homey.app.rfxcomDeviceTypes[Fdevice.data.type].capabilities,
                        capability: {
                            measure_rain: result.data.rainrate,
                            meter_rain: result.data.raintotal,
                            measure_battery: result.lowbattery  // onoff dim temp etc as json  object of capabilities

                        },
                        icon: `/icons/${Fdevice.data.type}.svg`,
                        settings: { id: Fdevice.rx.type + Fdevice.data.type + result.id + result.rolling }
                    }

                    driverOregon.log(`processOregon filled device ${util.inspect(filledDevice)}`);
                    this.processOregonDevice(filledDevice);

                    


                    break;

                case "ec70":  // UV uv meter corona
                    Fdevice.data.type = `U`
                    filledDevice = {
                        data: {
                            id: result.id + result.rolling,             // homey id 
                            houseCode: 17,
                            unitCode: 17,
                            protocol: Fdevice.data.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                            type: Fdevice.data.type,           // type of                  Fdevice eg visonicdoorsensor

                        },
                        driver: 'oregon',
                        rx: Fdevice.rx, // index of rxtx where signals are received from for this device
                        tx: [], // index of rxtx where franes are send to for this device 
                        name: Fdevice.rx.type + result.id + result.rolling,            //   rxtx type and old id 
                        capabilities: Homey.app.rfxcomDeviceTypes[Fdevice.data.type].capabilities,
                        capability: {
                            measure_ultraviolet: result.data.uvindex,
                            measure_battery: result.lowbattery  // onoff dim temp etc as json  object of capabilities
                        },
                        icon: `/icons/${Fdevice.data.type}.svg`,
                        settings: { id: Fdevice.rx.type + Fdevice.data.type + result.id + result.rolling }
                    }

                    driverOregon.log(`processOregon filled device ${util.inspect(filledDevice)}`);
                    this.processOregonDevice(filledDevice);
                    break;
                case "ec40":  // THN132n only temp c844
                case "c844":  // THN132n only temp c844
                    Fdevice.data.type = 'T'
                    filledDevice = {
                        data: {
                            id: result.id + result.rolling,             // homey id 
                            houseCode: 17,
                            unitCode: 17,
                            protocol: Fdevice.data.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                            type: Fdevice.data.type,           // type of                  Fdevice eg visonicdoorsensor

                        },
                        driver: 'oregon',
                        rx: Fdevice.rx, // index of rxtx where signals are received from for this device
                        tx: [], // index of rxtx where franes are send to for this device 
                        name: Fdevice.rx.type + result.id + result.rolling,            //   rxtx type and old id 
                        capabilities: Homey.app.rfxcomDeviceTypes[Fdevice.data.type].capabilities,
                        capability: {
                            measure_temperature: parseFloat(parseFloat(result.data.temperature).toFixed(2)),
                            measure_battery: result.lowbattery  // onoff dim temp etc as json  object of capabilities
                        },
                        icon: `/icons/${Fdevice.data.type}.svg`,
                        settings: { id: Fdevice.rx.type + Fdevice.data.type + result.id + result.rolling }
                    }

                    driverOregon.log(`processOregon filled device ${util.inspect(filledDevice)}`);
                    this.processOregonDevice(filledDevice);
            }

        }
        //#endregion

        
      

        this.processOregonDevice = (filledDevice) => {


            driverOregon.log('  processOregonDevice entered ');

            

            driverOregon.log(`processOregon filled device ${util.inspect(filledDevice)}`);

            if (!this.contains(driverOregon.homeyDevices, filledDevice)) {

                driverOregon.log('device is not yet registered');
                driverOregon.homeyDevices.push(filledDevice);
            } else {

                const device = driverOregon.getDevice(filledDevice.data);
                if (device instanceof Homey.Device) {
                    Homey.app.log('oregondecoding device is already registered')
                    driverOregon.log('device is already registered');
                    device.log(`device is already registered with  getData() ${util.inspect(device.getData())}  `)
                    device.updateCapabilitiesOregon(filledDevice)
                }
            }







        }


     

      
     

    


        //end processdata




    } // end constructor

    //TODO ipmplement filleddevice, icorporate drivers in driver lib, make one device eith multiple capablities preventing duplicste code
    //TODO  after filled device is implemented remove it with device wihich is generated in rxtxcom 




} // end class

module.exports = new oregondecoding()