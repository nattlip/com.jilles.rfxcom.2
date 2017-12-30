"use strict";



const util = require('util');
const fs = require('fs');
const libClass = require('../../libClass.js')
const convert = require('../../baseConverter.js').jan.ConvertBase;
const helpFunctions = require('../../helpFunctions.js').jan;
const path = require('path');
const libNew = require('../../lib.js')
const eol = ' \n'
const eolf = ' \n\r'

const Homey = require(`homey`)
const simpel = new Homey.SimpleClass()
const driverSecurity = Homey.ManagerDrivers.getDriver('slave')


class visonicdecoding extends libNew {

    constructor() {

        super()

        this.lib = new libClass();
        this.lib.log = this.lib.log.bind(this);
        this.debug = true;//  to set debug on or off  
        this.filename = path.basename(__filename)
        this.dirname = path.basename(__dirname);
        this.lib.log = this.lib.log.bind(this);
        this.lib.log(` ${this.constructor.name}  is this.         welkom to ${this.constructor.name}`);
       // this.lib.log(` ${this.constructor.name}  is this.`, util.inspect(this))


        let VisonicSensors = {}

        let knownVisonicSensorsMap = {

            "a9": { name: "DWSvisonic", layout: "DWS" },
            "05": { name: "DWSsecurityX10", layout: "DWS" }

        }

        let dataLayouts = {

            "DWSvisonic": {
                len: 7,
                startAddress: 2,    // nibble  number address starts  nibble is one of 2 of bte FF F and F
                addressLength: 6,   //   nibble lenght  
                skipAtEnd: 1

            }



        }










        // called by rxtxrfxcom decodedata
        this.decodeDataVisonic = (device, hexStr) => {

            let appV = `Rfxcom`
            let driverV = `slave`
            let capabilitiesV = [
                "alarm_contact",
                "alarm_battery",
                "alarm_tamper",
                "alarm_motion",
                "alarm_night"
            ]

            

            // if (hexStr > 2) {
            let dataBin = convert.hex2bin(hexStr)
             this.lib.log(`BIN  ` + dataBin)
             this.lib.log(`hexStr length`, hexStr.length)
             this.lib.log(`dataBin length`, dataBin.length)




            let identifier = (hexStr.slice(0, 2))
             this.lib.log(`identifier  `, identifier)
            let devicetype = lookDeviceUp(identifier)
             this.lib.log(`devicetype `, devicetype)
             this.lib.log(`dataLayouts[devicetype]  `, dataLayouts[devicetype])
            let address = hexStr.slice(2, 6) + hexStr.slice(10, 12)
             this.lib.log(`address `, address)
            let info = hexStr.slice(dataLayouts[devicetype].startAddress + dataLayouts[devicetype].addressLength, hexStr.length - dataLayouts[devicetype].skipAtEnd)
             this.lib.log(`info `, info)
            let infoBin = convert.hex2bin(info)
             this.lib.log(`infobin `, infoBin)
            //let infoByte = hexStr.slice(dataLayouts[devicetype].startAddress + dataLayouts[devicetype].addressLength, dataLayouts[devicetype].startAddress + dataLayouts[devicetype].addressLength + 2)
            let infoByte = hexStr.slice(dataLayouts[devicetype].addressLength, dataLayouts[devicetype].addressLength + 2)
             this.lib.log(`infobyte `, infoByte)

            //   (byte 3, bit3) 0 is motion sensor
            //first inibble of infobyte
            let typeHex = hexStr.slice(dataLayouts[devicetype].addressLength, dataLayouts[devicetype].addressLength + 2)
             this.lib.log(' typehex  ', typeHex);
            let typeNibble = pad(convert.hex2bin(typeHex), 4)
             this.lib.log(' typenibble  ', typeNibble);
            let typeBit = typeNibble.slice(0, 1)
             this.lib.log(' typenibble  ', typeBit);


             let state = false
             let tamper = false
             let battery = false
         
            // state alert = true state normal false battery high = flase low = true
            switch (infoByte) {
                case '44':
                     this.lib.log(`DWS[ ${address}  Visonic door sensor  Alert + Tamper  `)
                    state = true
                    tamper = true
                    battery = false
                    break;
                case 'c4':
                     this.lib.log(`DWS[ ${address}  Visonic door sensor  Normal + Tamper  `)
                    state = false
                    tamper = true
                    battery = false
                    break;
                case '04':
                     this.lib.log(`DWS[ ${address}  Visonic door sensor  Alert  `)
                    state = true
                    tamper = false
                    battery = false
                    break;
                case '05':
                     this.lib.log(`DWS[ ${address}  Visonic door sensor  Alert (battery low  `)
                    state = true
                    tamper = false
                    battery = true
                    break;
                case '84':
                     this.lib.log(`DWS[ ${address}  Visonic door sensor   Normal  `)
                    state = false
                    tamper = false
                    battery = false
                    break;
                case '85':
                     this.lib.log(`DWS[ ${address}  Visonic door sensor   Normal (battery low)  `)
                    state = false
                    tamper = false
                    battery = true
                    break;
                case '4c':
                     this.lib.log(`MOTION[ ${address}  Visonic motion sensor  Alert + Tamper `)
                    state = true
                    tamper = true
                    battery = false
                    break;
                case 'cc':
                     this.lib.log(`MOTION[ ${address}  Visonic motion sensor  Normal + Tamper `)
                    state = false
                    tamper = true
                    battery = false
                    break;
                case '0c':
                     this.lib.log(`MOTION[ ${address}  Visonic motion sensor  Alert `)
                    state = true
                    tamper = false
                    battery = false
                    break;
                case '0d':
                     this.lib.log(`MOTION[ ${address}  Visonic motion sensor  Alert (battery low)`)
                    state = true
                    tamper = false
                    battery = true
                    break;
                case '8c':
                     this.lib.log(`MOTION[ ${address}  Visonic motion sensor  Normal`)
                    state = false
                    tamper = false
                    battery = false
                    break;
                case '8d':
                     this.lib.log(`MOTION[ ${address}  Visonic motion sensor  Normal (battery low) `)
                    state = false
                    tamper = false
                    battery = true
                  

            }

          

           
          

           
            




         


            let type = ''

            let capability = ''

            //let iconPath = '/app/com.jilles.rfxcom.2/drivers/slave/assets/icons/'
            let iconPath = '/icons/'
            let icon = ''

            if ( typeBit == 0 )
            {
                type = 'visonicDoorSensor'
                capability = 'alarm_contact'
                icon = 'contact.svg'
            }
            else
            {
                type = 'visonicMotionSensor'
                capability = 'alarm_motion'
                icon = 'motion.svg'
            }





            


               // let hDevice = libClass.computeHomeyDevice(deviceParams, appV, driverV, capabilitiesV, type, address, state, battery, tamper)

                let filledDevice = {
                    data: {   
                        id: address,             // homey id 
                        houseCode: 1,
                        unitCode: 1,
                        protocol: device.data.protocol, //  visonic , x10 , oregon , etc klika elro etc handlers 
                        type: type,   // type of device eg visonicdoorsensor
                    },                   
                    driver: driverV,                           
                    name: device.rx.type + address,            //   rxtx type and old id 
                    rx:  device.rx ,   //lan or trx type   1,2,3  tab index of rxtx  which transceiver tabindex can change
                    capabilities: [capability, 'alarm_tamper', 'alarm_battery'],
                    capability: {
                        [capability]: state,
                        alarm_tamper: tamper,
                        alarm_battery: battery
                    },
                   icon: iconPath + icon
                  
                }
            //TODO device = filled device only for clarity is device object repeated
            // choose image according to detype device 





                 this.lib.log(`filled device `, filledDevice)
                this.transports(filledDevice)


           

        }

        this.transports = (filledDevice) => {

            if (!this.contains(driverSecurity.homeyDevices, filledDevice)) {
                driverSecurity.homeyDevices.push(filledDevice);
            } else {
                this.lib.log( ` device found in homey devioces ${filledDevice.data.id  }`)
                const device = driverSecurity.getDevice( filledDevice.data );
                this.lib.log( `device instanceof Homey.Device              ${device instanceof Homey.Device}` )
                if (device instanceof Homey.Device) {
                    Homey.app.log('orgeon decoding device is already registered')
                    driverSecurity.log('device is already registered');
                   device.log(`device is already registered with  getData() ${ util.inspect(device.getData())}  `)
                    device.updateCapabilitiesVisonic(filledDevice)
                    // client.end();
                    // return callback(Error('duplicate'));
                }
            }

          



        }

        // decoding visnoic in a spcial mode not used yet
        let decodeDataVisonic2 = hexStr => {

            let dataBin = convert.hex2bin(hexStr)
             this.lib.log(`BIN  ` + dataBin)
             this.lib.log(`hexStr length`, hexStr.length)
             this.lib.log(`dataBin length`, dataBin.length)


            //   (byte 3, bit3) 0 is motion sensor

            let identifier = (hexStr.slice(0, 2))
             this.lib.log(`identifier  `, identifier)
            let devicetype = lookDeviceUp(identifier)
             this.lib.log(`devicetype `, devicetype)
             this.lib.log(`dataLayouts[devicetype]  `, dataLayouts[devicetype])
            let address = hexStr.slice(dataLayouts[devicetype].startAddress, dataLayouts[devicetype].startAddress + dataLayouts[devicetype].addressLength)
             this.lib.log(`address `, address)
            let info = hexStr.slice(dataLayouts[devicetype].startAddress + dataLayouts[devicetype].addressLength, hexStr.length - dataLayouts[devicetype].skipAtEnd)
             this.lib.log(`info `, info)
            let infoBin = convert.hex2bin(info)
             this.lib.log(`infobin `, infoBin)
            let infoByte = hexStr.slice(dataLayouts[devicetype].startAddress + dataLayouts[devicetype].addressLength, dataLayouts[devicetype].startAddress + dataLayouts[devicetype].addressLength + 2)
             this.lib.log(`infobyte `, infoByte)


            if (!((parseInt(infoByte, 16) & parseInt("40", 16)) == 0))
                 this.lib.log(` alarm message   `, `ALERT`)
            else
                 this.lib.log(` alarm message   `, `CLOSE`)

            if (!((parseInt(infoByte, 16) & parseInt(80, 16)) == 0))
                 this.lib.log(` tamper message   `, `TAMPER`)
            else
                 this.lib.log(` tamper message   `, `NO TAMPER`)

            if (!((parseInt(infoByte, 16) & parseInt(20, 16)) == 0))
                 this.lib.log(` battery message   `, `Battery low`)
            else
                 this.lib.log(` battery message   `, `Battery ok`)

            if (!((parseInt(infoByte, 16) & parseInt(10, 16)) == 0))
                 this.lib.log(` alive message   `, `alive `)
            else
                 this.lib.log(` event message   `, `event`)

            if ((parseInt(infoByte, 16) & parseInt(8, 16)) == 0)
                 this.lib.log(` restore message   `, `restore reported `)
            else
                 this.lib.log(` restore message   `, `restore not reported`)

            if (!((parseInt(infoByte, 16) & parseInt(8, 16)) == 0))
                 this.lib.log(` contact message   `, `primary contact `)
            else
                 this.lib.log(` contact message   `, `secondary contact`)











        }



     let lookProtocolUp = identifier => knownVisonicSensorsMap[identifier]

     let lookDeviceUp = identifier => knownVisonicSensorsMap[identifier].name

     let pad = (num, size) => {
         var s = "000000000" + num;
         return s.substr(s.length - size);
     }

     


    } // end constructor







} // end class

module.exports = new visonicdecoding()





            // code in no visonic info

            //if (!((parseInt(infoByte, 16) & parseInt("40", 16)) == 0))
            //     this.lib.log(` alarm message   `, `ALERT`)
            //else
            //     this.lib.log(` alarm message   `, `CLOSE`)

            //if (!((parseInt(infoByte, 16) & parseInt(80, 16)) == 0))
            //     this.lib.log(` tamper message   `, `TAMPER`)
            //else
            //     this.lib.log(` tamper message   `, `NO TAMPER`)

            //if (!((parseInt(infoByte, 16) & parseInt(20, 16)) == 0))
            //     this.lib.log(` battery message   `, `Battery low`)
            //else
            //     this.lib.log(` battery message   `, `Battery ok`)

            //if (!((parseInt(infoByte, 16) & parseInt(10, 16)) == 0))
            //     this.lib.log(` alive message   `, `alive `)
            //else
            //     this.lib.log(` event message   `, `event`)

            //if ((parseInt(infoByte, 16) & parseInt(8, 16)) == 0)
            //     this.lib.log(` restore message   `, `restore reported `)
            //else
            //     this.lib.log(` restore message   `, `restore not reported`)

            //if (!((parseInt(infoByte, 16) & parseInt(8, 16)) == 0))
            //     this.lib.log(` contact message   `, `primary contact `)
            //else
            //     this.lib.log(` contact message   `, `secondary contact`)






            //succes = writableStream.write(`BIN  ` + infoBin + eolf);
