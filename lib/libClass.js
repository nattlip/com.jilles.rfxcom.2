'use strict';
const util = require('util');
var path = require('path');
const helpFunctions = require('./helpFunctions.js').jan;
// class for widely used functions
class lib
{

    constructor()
    {
        this.debug = true;
        this.filename = path.basename(__filename);
        this.dirname = path.basename(__dirname);


        util.log("path resolve  ", path.resolve('../driverGenerator/driverLib.js'))
        util.log('module.filenamev', module.filename)

        this.log =  function() 
        {
           


         if (this.debug)
         {
            

               
            
                [].unshift.call(arguments, `${this.constructor.name}::`);
               // [].unshift.call(arguments, `${this.filename} ::`);
             
                util.log.apply(this.log, arguments);  // this makes argumensts passed as parameter from this.log to console.log  
              //  [].shift.apply(arguments);
                
            }
           // else { console.log(false) }
        
        }

        //this.log = this.log.bind(this, this.constructor.name);

        //this.log('lib started')

     // doestn wwork static does compute device out of parameters  
       this.computeHomeyDevice = function(app, driver, capabilities,type)
    {
        let hD = {}
        hD.data = {}
        if (type = "X10") {
            hD.data.id = app + driver + this.houseCode + this.unitCode
            hD.data.houseCode = this.houseCode
            hD.data.unitCode = this.unitCode
            hD.data.type = driver
            hD.name = hD.data.id
            hD.capabilities = capabilities
            hD.capability = {};

            if (helpFunctions.containsCapability(capabilities, 'onoff'))
                hD.capability.onoff = false;
            //dim number from 0 to 1 decimals 2
            if (helpFunctions.containsCapability(capabilities, 'dim'))
                hD.capability.dim = 0;
            if (helpFunctions.containsCapability(capabilities, "alarm_motion"))
                hD.capability.alarm_motion = false;
            if (helpFunctions.containsCapability(capabilities, "alarm_night"))
                hD.capability.alarm_night = false;
        }

        else if (app == 'Rfxcom' && driver == `security`) {
            if (type == "visonicMotionSensor") {
                let hD =
                    {
                        data: {
                            driver: `security`,
                            type: "visonicMotionSensor",
                            protocol: `visonic`,
                            id: address,
                            houseCode: null,
                            unitCode: null,
                        },   // eg security  ms14e visonic  address
                        name: address,
                        capabilities: ['alarm_motion', 'alarm_tamper', 'alarm_battery'],
                        capability: {
                            alarm_motion: (state == `Alert` ? true : false),
                            alarm_tamper: tamper,
                            alarm_battery: (battery == `high` ? false : true)

                        }
                    }

            }
            else if (type == "visonicDoorSensor") {
                let hD =
                    {
                        data: {
                            driver: `security`,
                            type: `visonicDoorSensor`,
                            protocol: `visonic`,
                            id: address,
                            houseCode: null,
                            unitCode: null,
                        },   // eg security  ms14e visonic  address
                        name: address,
                        capabilities: ['alarm_contact', 'alarm_tamper', 'alarm_battery'],
                        capability:
                        {
                            alarm_contact: (state == `Alert` ? true : false),
                            alarm_tamper: false,
                            alarm_battery: (battery == `high` ? false : true)


                        }   // onoff dim temp etc as jsonjson

                    }
               }







        }





        return hD
    } 

//not working static is
     this.getDeviceById =  (deviceIn) =>
{
    this.log(" 329 homeydevices  ", this.homeyDevices);   // undefiend
    this.log('getDeviceById deviceIn', deviceIn);
    let matches = this.homeyDevices.filter(d => d.data.id === deviceIn.id);
    return matches ? matches[0] : null;
}











//#endregion

    }// end constructor

    //static function this is used by generic driver
    static computeHomeyDevice(deviceParams, app, driver, capabilities,type,address,state,battery,tamper) {


        let houseCode = deviceParams.houseCode
        let unitCode = deviceParams.unitCode
        let hD = {}
        hD.data = {}
        if (type == "X10") {
            hD.data.id = app + driver + houseCode + unitCode
            hD.data.houseCode = houseCode
            hD.data.unitCode = unitCode
            hD.data.type = driver
            hD.name = hD.data.id
            hD.capabilities = capabilities
            hD.capability = {};

            if (helpFunctions.containsCapability(capabilities, 'onoff'))
                hD.capability.onoff = false;
            //dim number from 0 to 1 decimals 2
            if (helpFunctions.containsCapability(capabilities, 'dim'))
                hD.capability.dim = 0;
            if (helpFunctions.containsCapability(capabilities, "alarm_motion"))
                hD.capability.alarm_motion = false;
            if (helpFunctions.containsCapability(capabilities, "alarm_night"))
                hD.capability.alarm_night = false;

        }

        else if (app == 'Rfxcom' && driver == `security`) {
            if (type == "visonicMotionSensor") {
             hD =
                    {
                        data: {
                            driver: `security`,
                            type: "visonicMotionSensor",
                            protocol: `visonic`,
                            id: address,
                            houseCode: null,
                            unitCode: null,
                        },   // eg security  ms14e visonic  address
                        name: address,
                        capabilities: ['alarm_motion', 'alarm_tamper', 'alarm_battery'],
                        capability: {
                            alarm_motion: state,
                            alarm_tamper: tamper,
                            alarm_battery: battery

                        }
                    }

            }
            else if (type == "visonicDoorSensor") {
                hD =
                    {
                        data: {
                            driver: `security`,
                            type: `visonicDoorSensor`,
                            protocol: `visonic`,
                            id: address,
                            houseCode: null,
                            unitCode: null,
                        },   // eg security  ms14e visonic  address
                        name: address,
                        capabilities: ['alarm_contact', 'alarm_tamper', 'alarm_battery'],
                        capability:
                        {
                            alarm_contact: state,
                            alarm_tamper: tamper,
                            alarm_battery: battery 


                        }   // onoff dim temp etc as jsonjson

                    }
            }







        }


















        this.lib.log('hD ', hD)
        return hD
    }
     
   
     static getDeviceById(dd) 
     {
         this.lib.log(" 329 homeydevices  ", Homey.app.homeyDevices);   // undefiend
         this.lib.log("339 homeydevices in app.ja  ", Homey.app.homeyDevices);
         let matches = Homey.app.homeyDevices[dd.id]
         return matches ? matches[0] : null;


     }

     static updateCapabilitiesHomeyDevice  (app, driver, capabilities, device, capability, value) 
{
    this.lib.log('updateCapabilitiesHomeyDevice capabilities    ', util.inspect(capabilities, false, null));
    this.lib.log('updateCapabilitiesHomeyDevice capability    ', util.inspect(capability, false, null));
    this.lib.log('updateCapabilitiesHomeyDevice value    ', value);
    //  this.lib.log('567 changeDesc homeyDevices before change  ', util.inspect(homeyDevices, false, null));

    if (type = 'X10')
    {
        if (capabilities.indexOf(capability) != -1) 
        {
            for (let i in Homey.app.homeyDevices)
            {

                if (Homey.app.homeyDevices[i].type == driver &&
                    Homey.app.homeyDevices[i].data.houseCode == device.data.houseCode &&
                    Homey.app.homeyDevices[i].data.unitCode == device.data.unitCode)
                {
                    //  this.lib.log('567 updateCapabilitiesHomeyDevice before change homeyDevices[i]  ', util.inspect(homeyDevices[i], false, null));
                    Homey.app.homeyDevices[i].capability[capability] = value;
                    // relatime params device_data , capability ,value
                 



                    this.lib.log('updateCapabilitiesHomeyDevice Homey.app.homeyDevices[i].data   ', Homey.app.homeyDevices[i].data)

                    //     this.lib.log('567 updateCapabilitiesHomeyDevice after change homeyDevices[i]  ', util.inspect(Homey.app.homeyDevices[i], false, null))

                    break;  //stop this loop we found it
                }
                else if (Homey.app.homeyDevices[i].type == "MS13E" &&
                    Homey.app.homeyDevices[i].data.houseCode === device.data.houseCode &&
                    Number(Homey.app.homeyDevices[i].data.unitCode) === Number(device.data.unitCode - 1) &&
                    driver === "MS13E"
                )
                {
                    console.log('updateCapabilitiesHomeyDevice alarm night   ', device.capability.alarm_motion)

                    Homey.app.homeyDevices[i].capability.alarm_night = value;
                    // Homey.app.realtime(Homey.app.homeyDevices[i].data, 'alarm_night', device.alarm_motion);
                    break
                }
            }
        }
    }
}




}  // end class lib

module.exports =   lib ;