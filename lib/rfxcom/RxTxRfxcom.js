"use strict";


const Homey = require('homey');

const path = require('path');
const net = require("net")
const util = require('util');
const fs = require('fs');
var stream = require("stream");

const convert = require('../baseConverter.js').jan.ConvertBase;
const helpFunctions = require('../helpFunctions.js').jan;
const libClass = require('../libClass.js');

const oregon = require('./lan/oregondecoding.js')
const visonic = require('./lan/visonicdecoding.js')
const X10 = require('./lan/X10decoding.js')

const rfxtrxdecoding = require('./trx/rfxtrxdecoding.js')  // rfxtrx
const newLib = require('../lib.js');
const socketClient = require('./socketClient.js');
// for rfxtrx and lan 

class RfxcomRxTx extends newLib {


    // constructed from manager
    constructor(RxTx) {

        super()

        this.filename = path.basename(__filename)
        this.dirname = path.basename(__dirname);
        this.lib = new libClass();

       
        this.lib.log = this.lib.log.bind(this);
        this.debug = true;//  to set debug on or off 

        this.capability = "" //   "rx"  // rx or tx   // todo 
        this.type = RxTx.type
        this.ip = RxTx.ip
        this.rx = RxTx.rx
        this.tx = RxTx.tx
        this.processReceivedData = RxTx.processReceivedData
        this.sendData = RxTx.sendData
        

        this.reconnectTimerSet = false
        this.connectCounter = 0
        this.connecting = false // global connecting state to prevent reconnects
        this.connected = false
        this.reconnectIntervalLan = 30000
        this.reconnectIntervalRfx = 30000
        this.clientSetTimeOut = 120000


        this.rfxcomconnected = false
        this.serverSet = false;
        this.serverConnected = false;
        this.serverTesting = true; // testing at start and if servervariables are set, have to test first
        this.serverTested = false; //Homey.m
        //Homey.manager('settings').set('testing', this.serverTesting);


        // connected and testing is not a setting but a property
        // only settings are Rxport and Txport ,better rfxcom trnasceivers so they can be build form scratch at start 
        // settings has to be done in app to get te settingings for all transceivers




        this.RxTxTypeMap =
            {
                1: 'RxLan',
                2: 'RxTxLan',
                3: 'TxLan',
                4: 'RfxTrx'
            }



        this.RxTxTypes = [

            'RxLan',
            'TxLan',
            'RxTxLan',
            'RfxTrx'

        ]

        

        this.lib.log('this.type ', this.type)
        this.lib.log('this.Ip ', this.ip)
        this.lib.log('this.RxPort ', this.rx)
        this.lib.log('this.TxPort ', this.tx)


        const eol = ' \n'
        const eolf = ' \n\r'


        let previousDataStr = ``


        this.lib.log('this.capability  ', this.capability)

        console.log('Hello world');


        this.testServer = (input) => {

            Homey.manager('api').realtime('testing', input);
        }

        this.lib.log('before splitting devicetype ', this.ip, '  ', this.rx, '  ', this.type);





        // every type
        this.capability = "rx"
        // this.openClient(this.capability, this.ip, this.rx, this.type)
        this.clientRx = new socketClient(this.capability, this.ip, this.rx, this.type, this.processReceivedData,this.sendData)

        // lan type with tx
        if(this.type == 'TxLan' || this.type == 'RxTxLan') {
            this.capability = "tx"
            this.clientTx = new socketClient( this.capability, this.ip, this.tx, this.type, this.processReceivedData, this.sendData)
        }


      



      






    } // constructor
}     // class

module.exports = RfxcomRxTx;
