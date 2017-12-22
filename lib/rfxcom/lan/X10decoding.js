"use strict";



const util = require('util');
const fs = require('fs');
var stream = require("stream");
const path = require('path');
const libNew = require('../../lib.js')


const convert = require('../../baseConverter.js').jan.ConvertBase;
const helpFunctions = require('../../helpFunctions.js').jan;
const libClass = require('../../libClass.js')


const eol = ' \n'
const eolf = ' \n\r'

const Homey = require('homey');


class X10decoding extends libNew {



    constructor() {

        super()







        this.filename = path.basename(__filename)
        this.dirname = path.basename(__dirname);
        this.debug = true;//  to set debug on or off  
        this.lib = new libClass();
        this.lib.log = this.lib.log.bind(this); // makes that this class is this in function and not base class
        this.lib.log('welcome to appSignal');

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

        //#region receivedata

        this.parseRXData = (Fdevice, hexStr) => {
            this.lib.log('this is x10 decoding  ');

            // strip first byte which is lenthbyte rfxcom

            let hexStrPure = hexStr.slice(2, 10)

            let hexStrPureL = hexStrPure.length






            // new


            let hexstrLength = hexStr.slice(0, 2)
            this.lib.log(`hexstrlength  hex ${hexstrLength}  decimal ${convert.hex2dec(hexstrLength)}`)
            this.lib.log(`hexStr `, hexStr)

            let hexStr1 = hexStrPure.slice(0, 2)
            let hexStr2 = hexStrPure.slice(2, 4)
            let hexStr3 = hexStrPure.slice(4, 6)
            let hexStr4 = hexStrPure.slice(6, 8)

            this.lib.log('hexStr1    ', hexStr1);
            this.lib.log('hexStr2    ', hexStr2);
            this.lib.log('hexStr3    ', hexStr3);
            this.lib.log('hexStr4    ', hexStr4);

            let byte1 = helpFunctions.bitStringToBitArray(this.pad(convert.hex2bin(hexStr1), 8));
            let byte2 = helpFunctions.bitStringToBitArray(this.pad(convert.hex2bin(hexStr2), 8));
            let byte3 = helpFunctions.bitStringToBitArray(this.pad(convert.hex2bin(hexStr3), 8));
            let byte4 = helpFunctions.bitStringToBitArray(this.pad(convert.hex2bin(hexStr4), 8));


            this.lib.log('byte1  new  ', byte1);
            this.lib.log('byte2  new  ', byte2);
            this.lib.log('byte3  new  ', byte3);
            this.lib.log('byte4  new  ', byte4);



            byte1.push(...byte2, ...byte3, ...byte4)

            let payLoadBinArray = byte1

            this.lib.log(' payLoadBinArray ', payLoadBinArray + + '\x1b[0G');
            this.parseRXData2(Fdevice, payLoadBinArray)





        }

        // load is bin array 
        this.parseRXData2 = (Fdevice, load) => {








            let houseCode = "";
            let unitCode;
            let unitCodeString = "";
            let address = "";
            let command = "";

            this.lib.log(' load', load + '\x1b[0G');

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

            this.lib.log('Byte1    ', byte1);
            this.lib.log('Byte2    ', byte2);
            this.lib.log('Byte3    ', byte3);
            this.lib.log('Byte4    ', byte4);

            // check if there are equal number of 1 and 0 in array

            // [1, 3, 4, 2].find(x => x > 3) // 4


            let valid = this.checkZerosAndOnes(byte1, byte2, byte3, byte4);

            this.lib.log('checkZerosAndOnes    ', valid);

            if (valid) {
                // check if secenod and forth are complemet of array
                let complementbytescorrect = this.checkvalidcomplement(byte1, byte2, byte3, byte4);
                this.lib.log('complementbytescorrect    ', complementbytescorrect);

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
                    this.lib.log(' hc nibble ', houseCodeNibble);
                    let houseCodeNibbleString = helpFunctions.bitArrayToString(houseCodeNibble);
                    houseCode = (houseCodes[houseCodeNibbleString] != null ? houseCodes[houseCodeNibbleString].houseCode : null);
                    this.lib.log('housecode   ', houseCode)



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
                                this.lib.log(' dim housecode lastreceived command ', this.lastCommandReceived.houseCode);
                                this.lib.log("command  ", command);
                            }
                            else if (byte3[3] == 0) {
                                command = "bright"
                                this.lib.log(' bright housecode lastreceived command ', this.lastCommandReceived.houseCode);
                                this.lib.log("command  ", command);
                            }
                        }
                        // with all the housecode this command is used
                        else if (byte3[4] == 0) // all
                        {
                            if (byte3[3] == 1) {
                                this.lib.log(' all on housecode lastreceived command ', this.lastCommandReceived.houseCode);
                                command = "allon"
                                this.lib.log("command  ", command);
                            }
                            else if (byte3[3] == 0) {
                                this.lib.log(' all off housecode  lastreceived command', this.lastCommandReceived.houseCode);
                                command = "alloff"
                                this.lib.log("command  ", command);
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
                        this.lib.log('unitCodebitstring = unicode -1  ', unitCodeBitString);
                        unitCodeString = convert.bin2dec(unitCodeBitString);
                        this.lib.log('unitCode -1   ', unitCodeString);
                        unitCode = parseInt(unitCodeString);
                        unitCode += 1;
                        unitCodeString = unitCode.toString();

                        this.lib.log('unitCode  ', unitCodeString);

                        address = houseCode + unitCodeString;

                        //retrieve command 
                        let commandBit = lfsbByte3[5];

                        if (commandBit == 1) {
                            command = "off"
                            this.lib.log("command  ", command);
                        }
                        else if (commandBit == 0) {
                            command = "on"
                            this.lib.log("command  ", command);
                        }


                        //TODO: check nummer of zeros and ones in byte 1,2 and 3,4 must be the same 
                        //TODO: number of commands send not process six times the same 
                        //TODO: define last send command for bright and dim
                        //TODO: bright and all commands off



                        //bitstring payload is decoded now. now finde the device with ths address and uodatecapabilities

                    } // else if normal command




                    this.lib.log(' all on housecode  ', this.lastCommandReceived.houseCode);

                    this.processX10Data(Fdevice, houseCode, unitCodeString, address, command);
                }; // complementcheck
            }// valid
        }; // end parsepayload

        // make ready for transport to homey 
        this.processX10Data = (Fdevice, houseCode, unitCodeString, address, command) => {

            let homeyCommand = false;

            if (unitCodeString !== '') {
                this.lastCommandReceived.houseCode = houseCode;
                this.lastCommandReceived.unitCode = unitCodeString;
                this.lastCommandReceived.command = command;
            }
            this.lib.log(' this.lastCommandReceived    ', this.lastCommandReceived);


            //on motion = motrion true . on night = night true
            if (command == "on") { homeyCommand = true }
            else if (command == "off") { homeyCommand = false }

            let driver = Homey.ManagerDrivers.getDriver('X10')
            let type = ''
            let deviceData = helpFunctions.GetDEviceDatafromHouseAndUnitCode(driver.devicesData, houseCode, unitCodeString)
            

            let capability = ''

            if ( deviceData )
            {
                this.lib.log( ' found devicedata    ', deviceData );
                type = deviceData.type
                let device = driver.getDevice( deviceData )

                

                if ( !type ) { type = 'UK' }
                else if ( type == 'MS13E' )
                {
                    if ( deviceData.unitCode == unitCodeString ) { capability = "alarm_motion" }
                    else if ( Number( deviceData.unitCode ) == Number( unitCodeString ) - 1 ) { capability = "alarm_night" }

                }

                device.setCapabilityValue( capability, homeyCommand )
                this.lib.log( `this.setCapabilityValue  ${capability} ${homeyCommand} ` );
              //  this.lib.log( ` ${ } ` );

                
            }

            
          

           
        

            let filledDevice = {
                data: {
                    id: Homey.app.app + Fdevice.data.protocol + driver.id + houseCode + unitCodeString,             // old id was rfxcom ms13 housecode unitcode same as name 
                    houseCode: houseCode,
                    unitCode: unitCodeString,
                    protocol: Fdevice.data.protocol,
                    type: type    // type of Fdevice eg visonicdoorsensor or ms13e
                },
                driver: Fdevice.driver,
                name: Homey.app.app + type + houseCode + unitCodeString,            //   rxtx type and old id 
                rx: Fdevice.rx, // index of rxtx where signals are received from for this Fdevice
                tx: [], // index of rxtx where franes are send to for this Fdevice                         
                capabilities: ["alarm_motion", "alarm_night"],
                capability: {
                    alarm_motion: (capability == "alarm_motion") ? homeyCommand : false,
                    alarm_night: (capability == "alarm_night") ? homeyCommand : false
                }


            }




            // old
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





            this.lib.log('typeof filledDevice ', typeof filledDevice)
            //TODO:  check if device exists
            if (typeof filledDevice !== "undefined") {
                // driverMS13E.updateCapabilitiesHomeyDevice('X10','MS13E',homeyDevice.capabilities, homeyDevice,"alarm_motion",command);
                //appReference.processResult(result)



                this.lib.log(' result decoding received X10 signal  from lan device to filled device ', filledDevice);




                //Homey.app.processX10LanResult(filledDevice)



            };



            //TODO only ms13e is processed 
            // trx oregon isnt updated anymore


        };  // endprocessdata
        //#endregion

        //#region senddata



        // from masterdevice 
        this.processSendCommand = (sendCommandFromMasterDevice) => {

            this.commandSend = sendCommandFromMasterDevice

            let houseCodeString = sendCommandFromMasterDevice.houseCode
            let unitCodeString = sendCommandFromMasterDevice.unitCode
            let commandString = sendCommandFromMasterDevice.X10Command

            //this.SendHexStringToLanRxTx(houseCodeString, unitCodeString, commandString)



            if (commandString == 'allon' || commandString == 'alloff' || commandString == 'bright' || commandString == 'dim')
            {

                if (commandString == 'bright' || commandString == 'dim')
                {

                    // i f lastcommand on off has the same address
                    if (this.lastCommandSend.houseCode == houseCodeString && this.lastCommandSend.unitCode == unitCodeString) {

                        this.lib.log('else if bright dim  correct last lcs', this.lastCommandSend)
                        this.lib.log('else if bright dim   correct last cs  ', this.commandSend)
                        this.sendCommandTrx(houseCodeString, unitCodeString, commandString);
                        this.SendHexStringToLanRxTx(this.codeX10SendCommand(houseCodeString, unitCodeString, commandString))
                    }
                    // send an extra on or af command with this address
                    else
                    {
                        this.lastCommandSend.houseCode = houseCodeString;
                        this.lastCommandSend.unitCode = unitCodeString
                        this.lastCommandSend.command = commandString
                        this.lib.log('else if bright dim  not correct last lcs', this.lastCommandSend)
                        this.lib.log('else if bright dim  not  correct last  cs', this.commandSend)
                        this.sendCommandTrx(houseCodeString, unitCodeString, "on");
                        this.SendHexStringToLanRxTx(this.codeX10SendCommand(houseCodeString, unitCodeString, "on"))
                        this.lib.log('sending on for dim', houseCodeString, unitCodeString, "on")

                        setTimeout(() => {
                            this.sendCommandTrx(houseCodeString, unitCodeString, commandString);
                            this.SendHexStringToLanRxTx(this.codeX10SendCommand(houseCodeString, unitCodeString, commandString))
                        }, 500);



                    }

                }
            }

            else if (commandString == 'on' || commandString == 'off')
            {


                // store last on of command               for all and dim 
                this.lib.log('else if on off before last = current  lcs ', this.lastCommandSend)
                this.lib.log(`command send X10 arrived`)

                this.lastCommandSend.houseCode = houseCodeString;
                this.lastCommandSend.unitCode = unitCodeString
                this.lastCommandSend.command = commandString

                this.lib.log('else if on off lcs ', this.lastCommandSend)
                this.lib.log('else if on off cs ', this.commandSend)

                // for homey signal
                // this.sendBitArray(this.codeX10SendCommand(houseCodeString, unitCodeString, commandString))

            }

            this.sendCommandTrx(houseCodeString, unitCodeString, commandString);

            this.SendHexStringToLanRxTx(this.codeX10SendCommand(houseCodeString, unitCodeString, commandString))

        }  // on send


        // this sends it to rxtx whit tx which ome ?






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
            let unitCodeByteString = ''


            let houseCodeNibble = helpFunctions.getKeyByValue(houseCodes, houseCodeString);

            if (commandString == 'allon' || commandString == 'alloff' || commandString == 'bright' || commandString == 'dim')
            {
                //byte 1

                this.lib.log('commandstring unusual   ', commandString);
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
                unitCodeByteString = helpFunctions.bitArrayToString(unitCodeByteArray)

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
                this.lib.log(`unitCodeString ${unitCodeString}`)
                this.lib.log(`unitCodeBin  ${unitCodeBin}`)
                this.lib.log(`unitCodeBinNibble  ${unitCodeBinNibble}`)

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



            let sendFrameArray = addressByteArray.concat(addressByteComplementArray, unitCodeByteArray, )

            this.lib.log('1st byte ', addressByteArray);
            this.lib.log('2d byte ', addressByteComplementArray);
            this.lib.log('3th byte ', unitCodeByteArray);
            this.lib.log('4th byte ', unitCodeByteComplementArray);



            // for homey signal    return sendFrameArray;

            //strings
            let addressByteHex = convert.bin2hex(addressByteString)
            let addressByteComplementHex = convert.bin2hex(addressByteComplementArray.join(""))
            let unitCodeByteHex = convert.bin2hex(unitCodeByteString)
            let unitCodeByteComplementHex = convert.bin2hex(unitCodeByteComplementArray.join(""))

            let SendLengthByte = '20'

            let sendHexFrameStringArray = [addressByteHex, addressByteComplementHex, unitCodeByteHex, unitCodeByteComplementHex]
            this.lib.log(` sendHexFrameStringArray     ${sendHexFrameStringArray}`)

            let sendHexFrameNumberArray = []

            for (var value of sendHexFrameStringArray) {               
                sendHexFrameNumberArray.push(parseInt(value, 16))
            }

            this.lib.log(` sendHexFrameNumberArray     ${sendHexFrameNumberArray}`)
            

            sendHexFrameNumberArray.unshift(parseInt(SendLengthByte, 16))

            this.lib.log(` sendHexFrameNumberArray aftersendlengthbyte added    ${sendHexFrameNumberArray}`)

            let hexSendBuffer = Buffer.from(sendHexFrameNumberArray)
            
            
            //for lan rfxcomdevice
            return hexSendBuffer;
        };


        this.SendHexStringToLanRxTx = (hexSendA) => {

            // hexstring so encoding must be hex not utf8(buffer)


            this.lanDevices = Homey.ManagerDrivers.getDriver("lan").getDevices()


            this.lanDevices.forEach((lanDevice) => {

                // if (lanDevice.transceiver.clientTx)

                lanDevice.transceiver.clientTx.sendCommandTxLan(hexSendA)

            }
            )



        }






        this.sendCommandTrx = (houseCodeString, unitCodeString, commandString) => {

            // first make a tx lan rxtx

            let sendArray = []

            sendArray[0] = 0x07;
            sendArray[1] = 0x10;
            sendArray[2] = 0x00;
            sendArray[3] = 0x01;
            sendArray[4] = houseCodeString.charCodeAt(0);
            sendArray[5] = Number(unitCodeString);
            if (commandString == "on") {
                sendArray[6] = 0x01
            }
            if (commandString == "off") {
                sendArray[6] = 0x00
            }
            sendArray[7] = 0

            //let swbuffer = [0x07, 0x10, 0x00, 0x01,
            //    0x41, 0x04, 0x00, 0];

            let sendBuffer = new Buffer(sendArray);
            this.lib.log(`sendBuffer  `, sendBuffer)

            this.rfxtrxDevices = Homey.ManagerDrivers.getDriver("rfxtrx").getDevices()


            this.rfxtrxDevices.forEach((rfxtrxDevice) => {

                rfxtrxDevice.transceiver.clientRx.sendCommandTrx(sendBuffer)

            }
            )


        }


        // for homey signal
        this.sendBitArray = (frametobesend) => {

            //   node js buffer makes 01 from 1 and 00 from 0
            // homey sends same signal with Buffer as Array.
            let buffer = new Buffer(frametobesend);

            this.signal.tx(buffer, function (err, result) {
                if (err != null) { this.lib.log('433Socket: Error:', err) }
                else {
                    this.lib.log('433Socket: result:', result);
                    this.lib.log('433Socket: array.length:', buffer.length);
                    this.lib.log('433Socket: array:   ', buffer);
                    counter2 += 1;
                    this.lib.log('433Socket: sendcounter:   ', counter2);

                };
            });

        };







        //#endregion














    } // constructor
} //class

module.exports = new X10decoding()