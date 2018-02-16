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
const driver = Homey.ManagerDrivers.getDriver('EW')

class easywavedecoding extends libNew {



    constructor() {

        super()

         //#region receivedata

        this.receiveSerialData = (pair,dataStr, rx) =>
        {
            Homey.app.log(`easywavedecoding.js recieved  pair  ${pair}   data   ${dataStr} `)

            if (pair == true) {

                driver.recieveAnswerToPair(dataStr)
            }






        }

        //#endregion



         //#region senddata
        // sendcommand = {'channel' : , 'command' : } `A` 'B'  'C'
         this.processSendCommand = (sendCommand) => {

            let rfxComDevices = Homey.ManagerDrivers.getDriver("RfxCom").getDevices()




            for (let rfxComDevice of rfxComDevices) {

                if (rfxComDevice.rfxComType == 'EldatPi')

                    rfxComDevice.transceiver.clientRx.sendCommandEldatPi(sendCommand)

            }




        }
         //#endregion


    }// constructor


}// class

module.exports = new easywavedecoding()