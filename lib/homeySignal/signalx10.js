"use strict";
const fs = require('fs');
const path = require('path');
const util = require('util');
const convert = require('./lib/baseConverter.js').jan.ConvertBase;
const helpFunctions = require('./lib/helpFunctions.js').jan;
const libClass = require('./lib/libClass.js')
const Homey = require('homey');

//import * as lib from './lib/libClass.js';

let counter = 0;
let counter2 = 0;
let t0 = [];
let t1 = [];
let jil;
let parse = true;

require('./lib/lib.js')();

let valid = false
let debouncer = false // false process ; true dont process


class signalX10
{     

    constructor() {
        


        let lib = new libClass();
        this.debug = true;//  to set debug on or off  
        lib.log = lib.log.bind(this); // makes that this class is this in function and not base class


        lib.log('welcome to Signalx10');



        this.lastCommandSend = { houseCode: '', unitCode: '', command: '' }  // needed for all on off and bright and dim
        this.commandSend = { houseCode: '', unitCode: '', command: '' }
        this.lastCommandReceived = { houseCode: '', unitCode: '', command: '' }



        //   Byte 1 bit 7 6 5 4 3 2 1 0  lfsb byte also

        let houseCodes = {

            '0110': { houseCode: 'A' },
            '0111': { houseCode: 'B' },
            '0100': { houseCode: 'C' },
            '0101': { houseCode: 'D' },
            '1000': { houseCode: 'E' },
            '1001': { houseCode: 'F' },
            '1010': { houseCode: 'G' },
            '1011': { houseCode: 'H' },
            '1110': { houseCode: 'I' },
            '1111': { houseCode: 'J' },
            '1100': { houseCode: 'K' },
            '1101': { houseCode: 'L' },
            '0000': { houseCode: 'M' },
            '0001': { houseCode: 'N' },
            '0010': { houseCode: 'O' },
            '0011': { houseCode: 'P' }

        }

        // http://www.printcapture.com/files/X10_RF_Receiver.pdf


//#region define signal


       let mySignal = new Homey.Signal('X10', '433');
        mySignal.register()

            .then(() => {

                // on a payload event
                mySignal.on('payload', (payload, first) => {
                    Homey.app.log('received from a device:', payload, 'isRepetition:', !first);

                    if (first)
                    {
                        counter = 0
                        valid = false
                        debouncer = false    // false process ; true dont process

                    }
                   else
                    { counter += 1; }

                    lib.log('payload length ', payload.length);
                    lib.log('counter                                    ', counter);
                    let payLoadString = helpFunctions.bitArrayToString(payload);
                    let payLoadArray = helpFunctions.bitStringToBitArray(payLoadString);
                    lib.log(' buffer string ', payLoadString);

                    // mkes 0000 0100 
                    let str = '';
                    for (let i = 0; i < payLoadString.length; i += 8) {
                        str += payLoadString.slice(i, i + 8) + ' ';
                    }
                    lib.log(str);

                    helpFunctions.testsignalx10();


                    lib.log(' array length ', payLoadString.length);
                    lib.log('  payLoadArray ', payLoadArray + '\x1b[0G');
                    lib.log('payLoadArray  length ', payLoadArray.length);

                    // convert bits to usable data


                    this.parseRXData2(payLoadArray,first);











                });

                // on a command event
                //mySignal.on('cmd', function (cmdId, first) {
                //    console.log('received a command from a device:', cmdId, 'isRepetition:', !first);
                //});

                // transmit the bits 01011001
                //  mySignal.tx([0, 1, 0, 1, 1, 0, 0, 1], this.log);

                // transmit predefined command
                //mySignal.cmd('ONOFF', this.log);

                // unregister the signal
                //  mySignal.unregister(this.log);

            })
            .catch(this.error)
      

 //#endregion


      



        //#region receive data

      

        //load is array
        this.parseRXData2 = (load,first) => {

            let houseCode = "";
            let unitCode;
            let unitCodeString = "";
            let address = "";
            let command = "";
           

            lib.log(' load', load + '\x1b[0G');

            let data = load;

            //NOTE: in 32 bits, standard X10 mode the bytes are transmitted as:   x10 rfxcom pdf in drive rfxcom vb.net
            //Received order Byte 1 Byte 2 Byte 3 Byte 4
            //Bytes changed of position Byte 3 Byte 4 Byte 1 Byte 2
            //Bits are changed 7 - 0 to 0 - 7 for all 4 bytes 

            let datalength = data.length;
            let bytelength = datalength / 8;
            // modules of length diveded by 8
            let extra = data.length % 8;

            //extract bytes in received order
            let byte1 = data.slice(0, 8);
            let byte2 = data.slice(8, 16);
            let byte3 = data.slice(16, 24);
            let byte4 = data.slice(24, 32);

            lib.log('Byte1    ', byte1);
            lib.log('Byte2    ', byte2);
            lib.log('Byte3    ', byte3);
            lib.log('Byte4    ', byte4);

            // check if there are equal number of 1 and 0 in array

            // [1, 3, 4, 2].find(x => x > 3) // 4

            if (!debouncer)
            {
                valid = checkZerosAndOnes(byte1, byte2, byte3, byte4);            
            }
           

            lib.log('checkZerosAndOnes    ', valid);
            lib.log('debouncer   ',debouncer );

            if (valid && !debouncer) {

                debouncer = true
                // check if secenod and forth are complemet of array
                let complementbytescorrect = checkvalidcomplement(byte1, byte2, byte3, byte4);
                lib.log('complementbytescorrect    ', complementbytescorrect);

                if (complementbytescorrect) {

                    // http://stackoverflow.com/questions/29802787/how-do-i-reverse-an-array-in-javascript-while-preserving-the-original-value-of-t?noredirect=1&lq=1
                    let lfsbByte1 = byte1.slice().reverse();  // reverses also byte 1 without slice
                    let lfsbByte2 = byte2.slice().reverse();
                    let lfsbByte3 = byte3.slice().reverse();
                    let lfsbByte4 = byte4.slice().reverse();

                    //lib.log('lfsbByte1    ', lfsbByte1);
                    //lib.log('lfsbByte2    ', lfsbByte2);
                    //lib.log('lfsbByte3    ', lfsbByte3);
                    //lib.log('lfsbByte4    ', lfsbByte4);


                    //retrieve housecode
                    //bitarray

                    let houseCodeNibble = byte1.slice(0, 4);
                    lib.log(' hc nibble ', houseCodeNibble);
                    let houseCodeNibbleString = helpFunctions.bitArrayToString(houseCodeNibble);
                    houseCode = (houseCodes[houseCodeNibbleString] != null ? houseCodes[houseCodeNibbleString].houseCode : null);
                    lib.log('housecode   ', houseCode)



                    //With a Dim, Bright, All Units On or All Units Off command (bit7 = 1), the unit numbers are not used.
                    //The last On or Off command indicates which unit will dim or bright  .

                    //    Dim = 0x98               bin   1001 1000
                    //    Bright = 0x88                  1000 1000
                    //    All Lights On = 0x90           1001 0000
                    //    All Lights Off= 0x80           1000 0000
                    //    unitnumber bits                 2 0 1 
                    // bit 7 is =1 then bright or all command

                    // first see if it isnt a dim or all command
                    if (byte3[0] == 1) {

                        if (byte3[4] == 1)  // dim or bright
                        {

                            if (byte3[3] == 1) {
                                command = "dim"
                                lib.log(' dim housecode lastreceived command ', this.lastCommandReceived.houseCode);
                                lib.log("command  ", command);
                            }
                            else if (byte3[3] == 0) {
                                command = "bright"
                                lib.log(' bright housecode lastreceived command ', this.lastCommandReceived.houseCode);
                                lib.log("command  ", command);
                            }
                        }
                        // with all the housecode this command is used
                        else if (byte3[4] == 0) // all
                        {
                            if (byte3[3] == 1) {
                                lib.log(' all on housecode lastreceived command ', this.lastCommandReceived.houseCode);
                                command = "allon"
                                lib.log("command  ", command);
                            }
                            else if (byte3[3] == 0) {
                                lib.log(' all off housecode  lastreceived command', this.lastCommandReceived.houseCode);
                                command = "alloff"
                                lib.log("command  ", command);
                            }
                        }
                    }
                    //TODO: process bright all on commands
                    //end     startnormal command
                    else if (byte3[0] == 0) {
                        // retrieveunitcode let unitCode =  (Byte 1 bit 2, Byte 3 bit 6, bit 3, bit 4) + 1
                        let unitCodeBitArray = [];

                        let byte1bit2 = lfsbByte1[2]; // bit 3 of unitnumber and off course the idiots used lfsb again 
                        let bitUnit3 = byte1bit2;
                        unitCodeBitArray.push(byte1bit2);


                        let byte3bit6 = lfsbByte3[6]; //bit 2 of unitnumber
                        let bitUnit2 = byte3bit6;
                        unitCodeBitArray.push(byte3bit6);


                        let byte3bit3 = lfsbByte3[3]; // bit 1 of unitnumber
                        let bitUnit1 = byte3bit3;
                        unitCodeBitArray.push(byte3bit3);


                        let byte3bit4 = lfsbByte3[4];  // bit 0 of unitnumber
                        let bitUnit0 = byte3bit4;
                        unitCodeBitArray.push(byte3bit4);

                        let unitCodeBitString = helpFunctions.bitArrayToString(unitCodeBitArray);
                        lib.log('unitCodebitstring = unicode -1  ', unitCodeBitString);
                        unitCodeString = convert.bin2dec(unitCodeBitString);
                        lib.log('unitCode -1   ', unitCodeString);
                        unitCode = parseInt(unitCodeString);
                        unitCode += 1;
                        unitCodeString = unitCode.toString();

                        lib.log('unitCode  ', unitCodeString);

                        address = houseCode + unitCodeString;

                        //retrieve command 
                        let commandBit = lfsbByte3[5];

                        if (commandBit == 1) {
                            command = "off"
                            lib.log("command  ", command);
                        }
                        else if (commandBit == 0) {
                            command = "on"
                            lib.log("command  ", command);
                        }


                        //TODO: check nummer of zeros and ones in byte 1,2 and 3,4 must be the same 
                        //TODO: number of commands send not process six times the same 
                        //TODO: define last send command for bright and dim
                        //TODO: bright and all commands off



                        //bitstring payload is decoded now. now finde the device with ths address and uodatecapabilities

                    } // else if normal command




                    lib.log(' all on housecode  ', this.lastCommandReceived.houseCode);

                    this.processX10Data(houseCode, unitCodeString, address, command);
                }; // complementcheck
            }// valid
        }; // end parsepayload

        // make ready for transport to homey 
        this.processX10Data = (houseCode, unitCodeString, address, command) => {

            let homeyCommand = false;

            if (unitCodeString !== '') {
                this.lastCommandReceived.houseCode = houseCode;
                this.lastCommandReceived.unitCode = unitCodeString;
                this.lastCommandReceived.command = command;
            }
            lib.log(' this.lastCommandReceived    ', this.lastCommandReceived);


            //on motion = motrion true . on night = night true
            if (command == "on") { homeyCommand = true }
            else if (command == "off") { homeyCommand = false }





            let result = {

                houseCode: houseCode,
                unitCode: unitCodeString,
                command: homeyCommand
            }


            let homeyDevice = {
                data: {
                    id: 'X10' + "MS13E" + houseCode + unitCodeString,
                    houseCode: houseCode,
                    unitCode: unitCodeString,
                    type: "MS13E",
                },
                name: 'X10' + "MS13E" + houseCode + unitCodeString,
                capabilities: ["alarm_motion", "alarm_night"],
                capability: {
                    alarm_motion: command,
                    alarm_night: false
                }
            }

            let driver = Homey.ManagerDrivers.getDriver('X10')
            let type = ''
            let deviceData = helpFunctions.GetDEviceDatafromHouseAndUnitCode(driver.devicesData, houseCode, unitCodeString)

            lib.log(' found deviceData ', deviceData)



            let capability = ''

            if (deviceData) {
                lib.log(' found devicedata    ', deviceData);
                type = deviceData.type
                let device = driver.getDevice(deviceData)



                if (!type) { type = 'UK' }
                else if (type == 'MS13E') {
                    if (deviceData.unitCode == unitCodeString) { capability = "alarm_motion" }
                    else if (Number(deviceData.unitCode) == Number(unitCodeString) - 1) { capability = "alarm_night" }

                }

                device.setCapabilityValue(capability, homeyCommand)
                lib.log(`this.setCapabilityValue  ${capability} ${homeyCommand} `);
                //  lib.log( ` ${ } ` );


            }



            lib.log('typeof result ', typeof result)
            //TODO:  check if device exists
            if (typeof result !== "undefined") {
                // driverMS13E.updateCapabilitiesHomeyDevice('X10','MS13E',homeyDevice.capabilities, homeyDevice,"alarm_motion",command);
                //appReference.processResult(result)
















            };







        };  // endprocessdata
        //#endregion

        //#region send data



        //codes the x10 command of a specific device
        this.codeX10SendCommand = (houseCodeString, unitCodeString, commandString) => {

            // to remember to  make it lastsendcommand after sending it at end of this void
            this.commandSend.houseCode = houseCodeString
            this.commandSend.unitCode = unitCodeString
            this.commandSend.command = commandString



            let addressByteArray = [];                // byte 1
            let addressByteComplementArray = [];      // byte 2  
            let unitCodeByteArray = [];               // byte 3 
            let unitCodeByteComplementArray = [];     // byte 4

            let addressByteString = ''



            let houseCodeNibble = helpFunctions.getKeyByValue(houseCodes, houseCodeString);

            if (commandString == 'allon' || commandString == 'alloff' || commandString == 'bright' || commandString == 'dim') {
                //byte 1

                lib.log('commandstring unusual   ', commandString);
                addressByteString = houseCodeNibble + '0000';
                addressByteArray = helpFunctions.bitStringToBitArray(addressByteString)

                //With a Dim, Bright, All Units On or All Units Off command (bit7 = 1), the unit numbers are not used.
                //The last On or Off command indicates which unit will dim or bright  .

                //    Dim = 0x98               bin   1001 1000
                //    Bright = 0x88                  1000 1000
                //    All Lights On = 0x90           1001 0000
                //    All Lights Off= 0x80           1000 0000
                //    unitnumber bits                 2 0 1 
                // bit 7 is =1 then bright or all command



                switch (commandString) {

                    case "allon":
                        unitCodeByteArray = [1, 0, 0, 1, 0, 0, 0, 0]
                        break;
                    case "alloff":
                        unitCodeByteArray = [1, 0, 0, 0, 0, 0, 0, 0]
                        break;
                    case "bright":
                        unitCodeByteArray = [1, 0, 0, 0, 1, 0, 0, 0]
                        break;
                    case "dim":
                        unitCodeByteArray = [1, 0, 0, 1, 1, 0, 0, 0]

                }


            }




            else if (commandString == 'on' || commandString == 'off') {





                let unitCodeNumber = Number(unitCodeString);

                unitCodeNumber -= 1;

                unitCodeString = unitCodeNumber.toString();


                let unitCodeBin = convert.dec2bin(unitCodeString);

                //let pad = function (str, max) {
                //     return str.length < max ? pad("0" + str, max) : str;
                // };

                function pad(str, max) {
                    return str.length < max ? pad("0" + str, max) : str;
                };


                let unitCodeBinNibble = pad(unitCodeBin, 4);

                // lfsb of course   and zero basei ndex
                let unitCodeBit1 = unitCodeBinNibble.slice(0, 1);   // byte 1 2
                let unitCodeBit2 = unitCodeBinNibble.slice(1, 2);   // byte 3 6
                let unitCodeBit3 = unitCodeBinNibble.slice(2, 3);   //        3
                let unitCodeBit4 = unitCodeBinNibble.slice(3, 4);   //        4






                addressByteString = houseCodeNibble + '0' + unitCodeBit1 + "00";
                //byte 1
                addressByteArray = helpFunctions.bitStringToBitArray(addressByteString)

                let commandBit = '';

                if (commandString == "off") {

                    commandBit = '1'
                }
                else if (commandString == "on") {
                    commandBit = "0"
                }

                let unitCodeByteString = ''

                //TODO: implement dim
                // unitCodeByte  bit7 = dim = 1 or  units + address lastsend command  no unit then , bit6 = bit2 of unitnumber un , bit5 = 1=off command, 0=on command  ,  bit4 = bit0 un , bit3 = bit1 of un, bit 2,1,0 = 0 
                unitCodeByteString = '0' + unitCodeBit2 + commandBit + unitCodeBit4 + unitCodeBit3 + "000";


                //byte 3
                unitCodeByteArray = helpFunctions.bitStringToBitArray(unitCodeByteString);






            } // if on or off  

            //byte 2  is complemt of byte 1  so number o f zero = number of 1 as check
            addressByteComplementArray = helpFunctions.ComplementBitArray(addressByteArray);
            //byte 4
            unitCodeByteComplementArray = helpFunctions.ComplementBitArray(unitCodeByteArray);



            let sendFrameArray = addressByteArray.concat(addressByteComplementArray, unitCodeByteArray, unitCodeByteComplementArray)
            lib.log('1st byte ', addressByteArray);
            lib.log('2d byte ', addressByteComplementArray);
            lib.log('3th byte ', unitCodeByteArray);
            lib.log('4th byte ', unitCodeByteComplementArray);             
        

                return sendFrameArray;         


        };

        

        // sends calculated bit array with signal
        this.sendBitArray = (frametobesend) => {

            //   node js buffer makes 01 from 1 and 00 from 0
            // homey sends same signal with Buffer as Array.
            let buffer = new Buffer(frametobesend);

            mySignal.tx(buffer, function (err, result) {
                if (err != null) { lib.log('433Socket: Error:', err) }
                else {
                    lib.log('433Socket: result:', result);
                    lib.log('433Socket: array.length:', buffer.length);
                    lib.log('433Socket: array:   ', buffer);
                    counter2 += 1;
                    lib.log('433Socket: sendcounter:   ', counter2);

                };
            });



        };



        // 1 = off 0 = on;
        //let testcommand = "off";
        //let testhousecode = 'H';
        //let testunitcode = '1';
        // 1 = off 0 = on;
        //let testcommand = "on";

        //let send =this.codeX10Command(testhousecode, testunitcode, testcommand);

        //setTimeout(function () {
        //   this.sendbitarray(send);
        //}, 2000);
        //jil_1.sendbitarray(jil_1.codeX10Command(testhousecode, testunitcode, testcommand));



      



        // this is emitted by driverlib to send
        this.processSendCommand = (sendCommand) => {

            let houseCodeString = sendCommand.houseCode
            let unitCodeString = sendCommand.unitCode
            let commandString = sendCommand.X10Command

            if (commandString == 'allon' || commandString == 'alloff' || commandString == 'bright' || commandString == 'dim') {


                if (commandString == 'bright' || commandString == 'dim') {

                    // i f lastcommand on off has the same address
                    if (this.lastCommandSend.houseCode == houseCodeString && this.lastCommandSend.unitCode == unitCodeString) {

                        lib.log('else if bright dim  correct last lcs', this.lastCommandSend)
                        lib.log('else if bright dim   correct last cs  ', this.commandSend)

                        this.sendBitArray(this.codeX10SendCommand(houseCodeString, unitCodeString, commandString))
                    }
                    // send an extra on or af command with this address
                    else {
                        this.lastCommandSend.houseCode = houseCodeString;
                        this.lastCommandSend.unitCode = unitCodeString
                        this.lastCommandSend.command = commandString
                        lib.log('else if bright dim  not correct last lcs', this.lastCommandSend)
                        lib.log('else if bright dim  not  correct last  cs', this.commandSend)

                        this.sendBitArray(this.codeX10SendCommand(houseCodeString, unitCodeString, "on"))
                        lib.log('sending on for dim', houseCodeString, unitCodeString, "on")    

                           setTimeout( () => {
                               this.sendBitArray(this.codeX10SendCommand(houseCodeString, unitCodeString, commandString))
                         }, 500);
                                       
                        

                    }

                }
            }
                else if (commandString == 'on' || commandString == 'off') {


                    // store last on of command               for all and dim 
                    lib.log('else if on off before last = current  lcs ', this.lastCommandSend)

                    this.lastCommandSend.houseCode = houseCodeString;
                    this.lastCommandSend.unitCode = unitCodeString
                    this.lastCommandSend.command = commandString

                    lib.log('else if on off lcs ', this.lastCommandSend)
                    lib.log('else if on off cs ', this.commandSend)

                    this.sendBitArray(this.codeX10SendCommand(houseCodeString, unitCodeString, commandString))

                }
            

        }  // processSendCommand


          //#endregion


    } // end constructor

} // end class

module.exports = new signalX10();







   

