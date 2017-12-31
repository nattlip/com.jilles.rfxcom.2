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
// for rfxtrx and lan 

class socketClient extends newLib {


    // capability = tx or rx
    constructor(capability, ip, port, type , processReceivedData,sendData) {

        super()

        this.lib = new libClass();       
        this.lib.log = this.lib.log.bind(this);
        this.debug = true;//  to set debug on or off

        this.lib.log(` welkom to ${this.constructor.name}  capability ${ capability} ip ${ ip } port ${port } type ${type }`);


        this.capability = capability
        this.ip = ip
        this.port = port
        this.type = type
       

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

        this.processReceivedData = processReceivedData
        this.sendData = sendData

        const eol = ' \n'
        const eolf = ' \n\r'
        let previousDataStr = ``
      


       

       
        this.openClient = (capability, ip, port, type) => {

            this.lib.log('capability  ', capability)

            if (capability == 'rx') {
                let reconnectTimer = undefined

                if (this.client == undefined) {
                    this.lib.log(`new socket  instantiated`);
                    this.client = new net.Socket();
                    this.client.setTimeout(30000)


                }





                this.lib.log(`openClient start counter ${this.connectCounter}       client     ${this.client}  `)

                // async
                this.connectClient = () => {

                    this.connectcounter += 1
                    this.lib.log(`connectClient start counter ${this.connectCounter}       client     ${this.client}  `)

                    if (!this.client.connecting) {
                        this.lib.log(`connecting called  ${type}  ${ip}  ${port}`);
                        this.client.connect(port, ip, () => {
                            this.lib.log(`connected to  ${type}  ${ip}  ${port}`);
                            if (reconnectTimer) { clearInterval(reconnectTimer); }
                            this.reconnectTimerSet = false
                            this.connected = true

                        });
                    }
                }




                let reconnect = () => {
                    this.lib.log(`      connecting to ${type}  ${ip}  ${port}`)
                    if (!this.client.connecting)
                        this.connectClient()
                }

                reconnect();

                if (!this.connected && !this.reconnectTimerSet) {
                    // We already found an OTG on this IP; re-connect to this every 30 seconds
                    this.reconnectTimerSet = true
                    reconnectTimer = setInterval(() => {
                        reconnect()
                    }, this.reconnectIntervalLan);
                }



                //TODO set encoding correct for differnece lan trx 
                //TODO reconnect after idle time rx
                //TODO add tx
                //TODO after restARTING rxtx are dioubled
                //TODO   rxtx socket not destroyed after deleting

                if (type != "TxLan") { this.client.setTimeout(this.clientSetTimeOut) }; // there should be communication at least once a minute  for transmitter sol still


                if (this.capability == 'rx') {

                    this.client.on('connect', () => {

                        this.lib.log(`on connect rxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ${type}  ${ip}  ${port}`);


                        if (this.type == 'RxLan' || this.type == 'RxTxLan') {

                            this.client.setEncoding("HEX")
                            this.client.setTimeout(60000)  // setting to short gives a lot of instances of client
                            this.SendModeCommandRxLan(this.client)
                        }
                        else if (this.type == 'RfxTrx') {  // encoding is utf8
                            this.lib.log(`RfxCom  type  ${type}  ip ${ip}  port ${port}`);
                            //this.client.setEncoding('hex')
                            this.sendStartSequenceTrx(this.client)
                            //  this.client.setEncoding('hex')
                            this.client.setTimeout(60000)
                        }



                    }) // on client connect





                }




                // fired if server sends a FIN packet
                this.client.on('end', () => {
                    this.lib.log(`on end event  ${type}  ${ip}  ${port}`);
                })




                this.client.on('timeout', () => {
                    this.lib.log(`client on timeout event ${type}  ${ip}  ${port}`);
                    this.connecting = false
                    if (this.reconnectTimerSet == false && this.connecting == false)
                        this.connectClient();
                });
                // Handle closed connections, try to re-open it
                this.client.on('close', (had_error) => {
                    this.lib.log(`on close event had_error   ${had_error}   ${type}  ${ip}  ${port}`);
                    this.connecting = false
                    // Connection dropped, try to re-connect
                    if (this.reconnectTimerSet == false && !this.client.connecting)

                        this.connectClient();

                });


                // if error this fires and closes socket and fires on close there is no socket end
                this.client.on('error', (err) => {

                    this.lib.log(`on socket error  ${type}  ${ip}  ${port}  ${err.message}`);
                    this.lib.log(`on socket error.code ${err.code}`);
                    this.lib.log(`on socket error.errno ${err.errno}`);
                    this.lib.log(`on socket error.port ${err.port}`);
                    this.lib.log(`on socket error.syscall ${err.syscall}`);


                    let jil = 5



                })

                this.client.on( 'data', ( dataStr ) =>
                {

                    if ( this.processReceivedData )
                    {

                        //dataStr = ``
                        //this.lib.log('Data Received Receiver: ' + dataStr);
                        //this.lib.log('Data Received Receiver: ' + dataStr);
                        //this.lib.log('DataLength Received Receiver: ' + dataStr.length);
                        //this.lib.log("socket.bytesRead      ", this.client.bytesRead)
                        //this.lib.log(`HEX  ` + dataStr + eolf);

                        // start making generic device
                        // homey device

                        this.lib.log( `data !! RfxComType ${this.type} ip ${this.ip} port ${this.port} data received  ${dataStr} ` )


                        if ( this.type == 'RxLan' || this.type == 'RxTxLan' )
                        {

                            if ( dataStr == `40` || dataStr == `2c` )
                            {
                                this.lib.log( `Server connected on data !! ip ${this.ip} response  ${dataStr} ` )



                            }
                            else
                            {

                                // extract firstbyte added by rfxcom 

                                if ( dataStr.length == 2 )
                                {
                                    previousDataStr = dataStr
                                    //          this.lib.log('DataLength Received Receiver should be 2 : ' + dataStr.length);
                                }
                                else if ( dataStr.length > 2 )
                                {

                                    let newDataString = previousDataStr + dataStr

                                    while ( newDataString.length > 0 )
                                    {
                                        //             this.lib.log('entered while loop : ' + dataStr.length);



                                        let firstbyte = newDataString.slice( 0, 2 )
                                        //             this.lib.log('firstbyte ', firstbyte)
                                        let firstByteBin = this.pad( convert.hex2bin( firstbyte ), 8 )
                                        let msbit = firstByteBin.slice( firstByteBin.length - 1 )   // 0 Master Receiver 433   Slave Receiver 868
                                        //           this.lib.log(`most significant bit firstbyte `, msbit)
                                        if ( msbit == `0` ) { this.lib.log( `message from Master` ) }
                                        else if ( msbit == '1' ) { this.lib.log( 'message from Slave' ) }




                                        let firstByteLengthBin = firstByteBin.slice( 2, 8 )   // 6 to 0 bit according to rfxcom    
                                        //              this.lib.log('lengthbyte rfxcom bin', firstByteLengthBin)
                                        let lengthbytehex = convert.bin2hex( firstByteLengthBin )  // length in hex = 2 characters FF 9A 
                                        //              this.lib.log('lengthbyte rfxcom hex ', lengthbytehex)


                                        let length = lengthbytehex

                                        if ( Number.isInteger( parseInt( length ) ) )
                                        {
                                            let message = newDataString.slice( 0, 2 * parseInt( length ) + 2 )


                                            newDataString = newDataString.slice( 2 * parseInt( length ) + 2 )

                                            lanDecodeData( message )
                                            //              this.lib.log('message frm lan ', message)
                                            let jil = 5
                                        }
                                        else
                                        {
                                            //this.lib.log('break')
                                            break
                                        }
                                    } // end while





                                    previousDataStr = ``
                                    let jil = 5

                                }


                            }
                        } // end if lan
                        else if ( this.type == 'RfxTrx' )
                        {

                            let dataUInt8Array = dataStr   // encoding is default  == utf8
                            

                            // Buffer.from(arrayBuffer[, byteOffset[, length]])

                            let buf = Buffer.from( dataUInt8Array )

                            this.lib.log( 'received Buffer from   ', buf )

                            //  data.push.apply(data, dataUInt8Array);
                            let data = Array.from( dataUInt8Array )


                            this.lib.log( 'Received array  data ' + data );







                            this.lib.log( "socket.bytesRead      ", this.client.bytesRead )
                            this.lib.log( 'Received: ' + data );

                            this.lib.log( `HEX receive 30-12-2017  ` + data + eolf );

                            let rx = { id: this.ip, type: this.type, ip: this.ip, rx: this.port, tx: null }


                            this.lib.log( ` rx   ${util.inspect(rx)} ` );

                            rfxtrxdecoding.receiveSerialData( dataUInt8Array, rx )







                        }  //else if RfxTrx

                    }  // if processReceivedData
                }); // on data




            } // end if capability rx

            // only txlan or rxtxlan
            else if (capability == 'tx') {
                let reconnectTimer = undefined

                if (this.client == undefined) {
                    this.lib.log(`new tx socket  instantiated`);
                    this.client = new net.Socket();
                    this.client.setTimeout(0)  // no timeout only sending data


                }





                this.lib.log(`openClient start counter ${this.connectCounter}       client     ${this.client}  `)

                // async
                this.connectClient = () => {

                    this.connectcounter += 1
                    this.lib.log(`connectClient start counter ${this.connectCounter}       client     ${this.client}  `)

                    if (!this.client.connecting) {
                        this.lib.log(`connecting called  ${type}  ${ip}  ${port}`);
                        this.client.connect(port, ip, () => {
                            this.lib.log(`connected to tx port ${type}  ${ip}  ${port}`);
                            if (reconnectTimer) { clearInterval(reconnectTimer); }
                            this.reconnectTimerSet = false
                            this.connected = true

                        });
                    }
                }




                let reconnect = () => {
                    this.lib.log(`      connecting to ${type}  ${ip}  ${port}`)
                    if (!this.client.connecting)
                        this.connectClient()
                }

                reconnect();

                if (!this.connected && !this.reconnectTimerSet) {
                    // We already found an OTG on this IP; re-connect to this every 30 seconds
                    this.reconnectTimerSet = true
                    reconnectTimer = setInterval(() => {
                        reconnect()
                    }, this.reconnectIntervalLan);
                }



                //TODO set encoding correct for differnece lan trx 
                //TODO reconnect after idle time rx
                //TODO add tx
                //TODO after restARTING rxtx are dioubled
                //TODO   rxtx socket not destroyed after deleting

               


                if (this.capability == 'tx') {

                    this.client.on('connect', () => {

                        this.lib.log(`on connect  ${ capability}  ${type}  ${ip}  ${port}`);


                        this.client.setEncoding("HEX")
                      //  this.client.setTimeout(60000)  // setting to short gives a lot of instances of client
                      
                        // command init with receiver connected
                        this.sendCommandTxLan(Buffer.from([0xf0, 0x33, 0xf0, 0x33]))  //`f033f033`





                    }) // on client connect





                }




                // fired if server sends a FIN packet
                this.client.on('end', () => {
                    this.lib.log(`on end event  ${type}  ${ip}  ${port}`);
                })




                this.client.on('timeout', () => {
                    this.lib.log(`client on timeout event ${type}  ${ip}  ${port}`);
                    this.connecting = false
                    if (this.reconnectTimerSet == false && this.connecting == false)
                        this.connectClient();
                });
                // Handle closed connections, try to re-open it
                this.client.on('close', (had_error) => {
                    this.lib.log(`on close event had_error   ${had_error}   ${type}  ${ip}  ${port}`);
                    this.connecting = false
                    // Connection dropped, try to re-connect
                    if (this.reconnectTimerSet == false && !this.client.connecting)

                        this.connectClient();

                });


                // if error this fires and closes socket and fires on close there is no socket end
                this.client.on('error', (err) => {

                    this.lib.log(`on socket error  ${type}  ${ip}  ${port}  ${err.message}`);
                    this.lib.log(`on socket error.code ${err.code}`);
                    this.lib.log(`on socket error.errno ${err.errno}`);
                    this.lib.log(`on socket error.port ${err.port}`);
                    this.lib.log(`on socket error.syscall ${err.syscall}`);


                    let jil = 5



                })

                this.client.on('data', (dataStr) => {
                    this.lib.log('Data Received Receiver: ' + dataStr);
                    this.lib.log('DataLength Received Receiver: ' + dataStr.length);
                    this.lib.log("socket.bytesRead      ", this.client.bytesRead)
                    this.lib.log(`HEX  ` + dataStr + eolf);

                    // start making generic device
                    // homey device




                    if (this.type == 'RxLan' || this.type == 'RxTxLan') {

                        if (dataStr == `40` || dataStr == `2c`) {
                            this.lib.log(`Server connected on data !! ip ${this.ip} response  ${dataStr} `)
                            //setTimeout(() => {                                                                        sdk1
                            //    Homey.manager('api').realtime('serverconnected', 'connected');
                            //    Homey.manager('api').realtime('errormessage', 'no error');
                            //}, 5000)
                        }
                        else {

                            // extract firstbyte added by rfxcom 

                            if (dataStr.length == 2) {
                                previousDataStr = dataStr
                                this.lib.log('DataLength Received Receiver should be 2  and is it  datalength = ' + dataStr.length);
                            }
                            else if (dataStr.length > 2) {

                                let newDataString = previousDataStr + dataStr

                                while (newDataString.length > 0) {
                                    this.lib.log('entered while loop : ' + dataStr.length);



                                    let firstbyte = newDataString.slice(0, 2)
                                    this.lib.log('firstbyte ', firstbyte)
                                    let firstByteBin = this.pad(convert.hex2bin(firstbyte), 8)
                                    let msbit = firstByteBin.slice(firstByteBin.length - 1)   // 0 Master Receiver 433   Slave Receiver 868
                                    this.lib.log(`most significant bit firstbyte `, msbit)
                                    if (msbit == `0`) { this.lib.log(`message from Master`) }
                                    else if (msbit == '1') { this.lib.log('message from Slave') }




                                    let firstByteLengthBin = firstByteBin.slice(2, 8)   // 6 to 0 bit according to rfxcom    
                                    this.lib.log('lengthbyte rfxcom bin', firstByteLengthBin)
                                    let lengthbytehex = convert.bin2hex(firstByteLengthBin)  // length in hex = 2 characters FF 9A 
                                    this.lib.log('lengthbyte rfxcom hex ', lengthbytehex)


                                    let length = lengthbytehex

                                    if (Number.isInteger(parseInt(length))) {
                                        let message = newDataString.slice(0, 2 * parseInt(length) + 2)


                                        newDataString = newDataString.slice(2 * parseInt(length) + 2)

                                      lanDecodeData(message)
                                        this.lib.log('message frm lan ', message)
                                        let jil = 5
                                    }
                                    else {
                                        //this.lib.log('break')
                                        break
                                    }
                                } // end while





                                previousDataStr = ``
                                let jil = 5

                            }


                        }
                    } // end if lan
                    else if (this.type == 'RfxTrx') {

                        let dataUInt8Array = dataStr   // encoding is default  == utf8
                        this.lib.log(`data from ${this.type}   ${dataStr}   , type of data   ${typeof dataStr}  `)

                        // Buffer.from(arrayBuffer[, byteOffset[, length]])

                        let buf = Buffer.from(dataUInt8Array)

                        this.lib.log('received Buffer from   ', buf)

                        //  data.push.apply(data, dataUInt8Array);
                        let data = Array.from(dataUInt8Array)


                        this.lib.log('Received array  data ' + data);







                        this.lib.log("socket.bytesRead      ", this.client.bytesRead)
                        this.lib.log('Received: ' + data);

                        this.lib.log(`HEX  ` + data + eolf);

                        let rx = { id: this.ip, type: this.type, ip: this.ip, rx: this.port, tx: null }


                        rfxtrxdecoding.receiveSerialData(dataUInt8Array, rx)







                    }  //else if rfxtrx


                }); // on data




            } // if capability tx



        } // end openclient


      
        this.openClient(this.capability, this.ip, this.port, this.type)


        this.SendModeCommandRxLan = (client) => {
            setTimeout(() => {
                let firstbyte = 0xF0
                let secondbyte = 0x2a//0x45 //no visonic
                //let secondbyte = 0x2A //0x2C //0X2A   2a receiveallpossible 2c rfxcom receiving

                //let buffer = Buffer.from([0xF0, 0x40])  // visonic mode
                // let buffer = Buffer.from([ 0xF040])  // visonic mode
                let buffer = Buffer.from([firstbyte, secondbyte])   // all possible receiving modes
                //  let buffer = Buffer.from([0x02, 0xA])   //

                client.write(buffer);
                this.lib.log(`${firstbyte.toString(16)}  ${secondbyte.toString(16)}   written`)
                this.lib.log(`${firstbyte}  ${secondbyte}   written`)

            }, 1000)

        }

        this.sendCommandTxLan = (frame) => {

            if ( this.sendData )
            {

                this.lib.log( `sendCommandTxLan    ${frame}         ` )

                this.client.write( frame, ( err, results ) =>
                {

                    this.lib.log( 'error write ', err )
                    this.lib.log( 'error result write ', results )

                } )

            }

        }



        this.sendStartSequenceTrx = (client) => {

            // this works with serial port
            let arrayB = [0x0D, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
            // this is for net port
            let bufferB = Buffer.from(arrayB)



            setTimeout(() => {


                client.write(bufferB, (err, results) => {

                    this.lib.log('error write ', err)
                    this.lib.log('error result write ', results)

                })

                let bufferB2 = Buffer.from([0x0D, 0x00, 0x00, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])



                setTimeout(() => {


                    client.write(bufferB2,  (err, results) => {

                        this.lib.log('error write ', err)
                        this.lib.log('error result write ', results)

                    })

                }, 1000);



            }, 500);



        } // sendcommandTrx

        /// this sendcommandTrx

        this.sendCommandTrx = (frame) => {

            if ( this.sendData )
            {

                this.lib.log( `SendcommandTrx sends command ` )

                this.client.write( frame, ( err, results ) =>
                {

                    this.lib.log( 'error write ', err )
                    this.lib.log( 'error result write ', results )

                } )

            }

        }




        // for lan first shift x10security mode from visonic mode
        let lanDecodeData = (hexStr) => {

            this.lib.log('enterd decode data ')

            let dataBin = convert.hex2bin(hexStr)
            //this.lib.log(`BIN  ` + dataBin)
            //this.lib.log(`hexStr length`, hexStr.length)
            //this.lib.log(`dataBin length`, dataBin.length)

            let hexStrmin = hexStr.slice(2)
            let dataBinmin = convert.hex2bin(hexStrmin)
            let hexStrminL = dataBinmin.length




            // second two bytes are address 2hex chars are 1 byte


            // 5A6D 5d60  
            // 1A2D 1d20
            // FA24 f824
            // EA7C ec70
            let firstbyte = ''
            firstbyte = hexStr.slice(0, 2)



            //add data type , tabindex of rxtx  

            // device instantated to birng values to hHomey Device
            let filledDevice =
                {
                    data: {
                        id: null,             // homey id 
                        houseCode: null,
                        unitCode: null,
                        protocol: null, //  visonic , x10 , oregon , etc klika elro etc handlers 
                        type: null,  // type of device eg visonicdoorsensor
                    },                
                    driver: null,                           
                    name: null,            //   rfxcom and old id 
                    rx: { id: this.ip, type: this.type, ip: this.ip, rx: this.port, tx: null },//lan or trx type   1,2,3  tab index of rxtx  which transceiver tabindex can change], // index of rxtx where signals are received from for this device
                    tx: {}, // index of rxtx where franes are send to for this device                     
                    capabilities: [],
                    capability: {},   // onoff dim temp etc as json  object of capabilities
                    icon: null
                }




            // this.lib.log(`landecoding ${util.inspect(filledDevice)} `)
            this.lib.log(`landecoding firstbyte ${firstbyte}   type of firstbyte   ${typeof firstbyte}`)
            this.lib.log(`hexStr ${hexStr}  `)






            // if oregon lan protocol
            if (firstbyte == '50' || firstbyte == '60' || firstbyte == '78') {
                filledDevice.data.protocol = 'oregon'

               // oregon.parseRXData(filledDevice, hexStr)
            }
            else if (firstbyte == 'a9') {
                filledDevice.data.protocol = 'visonic'
                visonic.decodeDataVisonic(filledDevice, hexStr)
            }
            else if (firstbyte == '20') {
                filledDevice.data.protocol = 'X10'
                filledDevice.driver = 'X10'
                 //X10.parseRXData(filledDevice,hexStr)
            }


        }













        let lookProtocolUp = identifier => knownVisonicSensorsMap[identifier]

        let lookDeviceUp = identifier => knownVisonicSensorsMap[identifier].name




        Homey.on('unload', () => {
            //this.lib.log('unloading app')

            this.client.destroy() // save some last settings, say goodbye to your remote connected devices, etc.
        });




} // constructor


} // class


module.exports = socketClient