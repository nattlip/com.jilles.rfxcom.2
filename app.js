'use strict';

const Homey = require('homey');

class rfxcomApp extends Homey.App {

    onInit() {

        this.X10LanSignal = require('./lib/rfxcom/lan/X10decoding.js');

        this.log(`${this.constructor.name} is running...`);

        //my definitions
        this.app = 'Rfxcom'

        this.RxTxTypesMap = {
            "1": "RxLan",
            "2": "RxTxLan",
            "3": "TxLan",
            "4": "RfxTrx"
        }


        this.RxTxTypes = [

            'RxLan',
            'TxLan',
            'RxTxLan',
            'RfxTrx'

        ]





        this.RxTx = {
            id: null,  // its ip for now must become mac 
            type: null, // lan  with or without transmitterer / trnasmitter or trx //
            ip: null,
            rx: null,  // or trx  can be difind by type if type is trx   port number
            tx: null,
        }

        this.X10DeviceArray = 
            [
              [ 1, 'MS13E' ],
              [ 2, 'OnOff'],
              [ 3, 'Dim'],
              [ 4, 'All' ] // for command all of or on
        ]

        this.X10DeviceMap = new Map(this.X10DeviceArray)

        this.virtualDeviceClassArray =
            [
                [1,'none' ],
                [2, 'light'],
                [3, 'kettle'],
                [4, 'amplifier'],
                [5, 'heater'],
                [6, 'fan'],// for command all of or on
                [7, 'speaker']
            ]


        this.virtualDeviceClassMap = new Map(this.virtualDeviceClassArray)

        


       
        this.rfxcomProtocols = {

            oregon: 'oregon',
            visonic: 'visonic',
            X10: 'X10'

        }

        this.rfxcomDeviceTypes = {
            "generic":  // as template
            {
                data: {
                    //{ type: null, index: null }, dfor more devicetypes per driver visonic motion sensor or doorsensor 
                    id: null,             // homey id 
                    houseCode: null,
                    unitCode: null,
                    protocol: null,
                    type: null,
                },
               
                driver: null,
               
                name: null,            //   rfxcom and old id 
                rx: [], // { type: null, index: null } of rxtx where signals are received from for this device  the device id of a rxtx is its ip
                tx: [], // { type: null, index: null } of rxtx where franes are send to for this device               
                capabilities: [],
                capability: {},  // onoff dim temp etc as json  object of capabilities
                icon: null
            },

            "MS13E":
            {
                data: {
                    id: null,             // homey id 
                    houseCode: null,
                    unitCode: null,
                    protocol: 'X10', //  visonic , x10 , oregon , etc klika elro etc ndlers 
                    type: "MS13E"
                },               
                driver: `X10`,               
                name: null,    // type of device eg visonicdoorsensor
                rx: [], //  //{ type: null, index: null }of rxtx where signals are received from for this device
                tx: [], // { type: null, index: null } of rxtx where franes are send to for this device               
                capabilities: ["alarm_motion", "alarm_night"],
                capability: {
                    alarm_motion: false,
                    alarm_night : false
                },   // onoff dim temp etc as json  object of capabilities
                icon: null
            },

            "OnOff":
            {
                data: {
                    id: null,             // homey id 
                    houseCode: null,
                    unitCode: null,
                    protocol: 'X10', //  visonic , x10 , oregon , etc klika elro etc ndlers 
                    type: "OnOff",           // type of device eg visonicdoorsensor
                },
             
                driver: "X10",              
                name: null,
                rx: [], // { type: null, index: null } of rxtx where signals are received from for this device
                tx: [], // { type: null, index: null } of rxtx where franes are send to for this device 
                capabilities: ['onoff'],
                capability: { onoff : false}   // onoff dim temp etc as json  object of capabilities
                , icon: null
            },

            "Dim":
            {
                data: {
                    id: null,             // homey id 
                    houseCode: null,
                    unitCode: null,
                    protocol: 'X10', //  visonic , x10 , oregon , etc klika elro etc ndlers 
                    type: "Dim",      // type of device eg visonicdoorsensor 
                },
                driver: "X10",
                    
                name: null,
                rx: [], // { type: null, index: null } of rxtx where signals are received from for this device
                tx: [], // { type: null, index: null } of rxtx where franes are send to for this device 
                capabilities: ['onoff', 'dim'],
                capability: {
                    onoff: false,
                    dim: 0
                },                // onoff dim temp etc as json  object of capabilities
                 icon: null
            },








            "visonicMotionSensor": {
                data: {
                    id: null,
                    houseCode: null,
                    unitCode: null,
                    protocol: `visonic`,
                    type: "visonicMotionSensor",
                },  
                driver: `security`,
                  // eg security  ms14e visonic  address
                name: null,
                rx: [], // { type: null, index: null } of rxtx where signals are received from for this device
                tx: [], // { type: null, index: null } of rxtx where franes are send to for this device 
                capabilities: ['alarm_motion', 'alarm_tamper', 'alarm_battery'],
                capability: {
                    alarm_motion: false,
                    alarm_tamper: false,
                    alarm_battery: false
                }  , // onoff dim temp etc as json
                 icon: null
            },

            "visonicDoorSensor": {
                data: {
                    id: null,
                    houseCode: null,
                    unitCode: null,
                    protocol: `visonic`,
                    type: `visonicDoorSensor`,
                },
                driver: `security`,
                // eg security  ms14e visonic  address
                rx: [], // { type: null, index: null } of rxtx where signals are received from for this device
                tx: [], // { type: null, index: null } of rxtx where franes are send to for this device 
                name: null,
                capabilities: ['alarm_contact', 'alarm_tamper', 'alarm_battery'],
                capability: {
                    alarm_contact: false,
                    alarm_tamper: false,
                    alarm_battery: false
                }   // onoff dim temp etc as json
                , icon: null
            },

            "security": {
                data: {
                    id: null,
                    houseCode: null,
                    unitCode: null,
                    protocol: `visonic`,
                    type: `visonicDoorSensor`,
                },   // eg security  ms14e visonic  address
                rx: [], // { type: null, index: null } of rxtx where signals are received from for this device
                tx: [], // { type: null, index: null } of rxtx where franes are send to for this device 
                driver: `security`,
                name: null,
                capabilities: ['alarm_contact', 'alarm_tamper', 'alarm_battery'],
                capability: {
                    alarm_contact: false,
                    alarm_tamper: false,
                    alarm_battery: false
                }   // onoff dim temp etc as json
                , icon: null
            }


        }


    }
}

module.exports = rfxcomApp;