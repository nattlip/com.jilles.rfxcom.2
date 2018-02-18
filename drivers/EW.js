'use strict';

const Homey = require('homey');
const masterDriver = require('../lib/masterdriver/masterdriver.js')

const helpFunctions = require('../lib/helpFunctions.js').jan;
const convert = require('../lib/baseConverter.js').jan.ConvertBase;
const util = require('util');
const Fdevice = require('../lib/filledDevice.js')


class EWDriver extends Homey.Driver {//extends masterDriver {

    onInit() {






        this.answerToPairDeviceWithEW
        this.devicesData = [];  // from drivers
        this.heardList = [];    // to be paired is list of devoicesdata. otherr device properties doesn matter
        this.devices = this.getDevices()
        //this.log('devices from getdevices  ', util.inspect(this.devices,true,null))
        this.log(' driver id  ', this.id)
        // this.log(`${this.id} devices       ${util.inspect(this.devices)}    `)

        for (let device of this.devices) {
            this.devicesData.push(device.getData())
        }
        this.log(`${this.id} devicesdata       ${util.inspect(this.devicesData)}    `)

        this.sendParameters = {}




    } // on end init

    // pairing 
    // there are 64 channels hex =40 is a  byte 
    // start at 00 else next avalible hex as channel  // channel is hex to be send to EW transceiver


    onPair(socket) {

        this.log(`onpair entered`)
        let command = ''
        let houseCode = '2'
        let unitCode = '2'
        let type = 'EW'   // type of device eg visonicdoorsensor or ms13e
        let protocol = 'EW'
        let driver = this.id
        let capabilities = []
        this.log(`devices.length   ${this.devices.length}  `)
        let channel = ''
        // keep it a string , a string must be send









        // temp for testing
        // channel = '01'


        // Homey.emit('sendUpCommand', { "command": 'up' });

        socket.on('sendCommand', data => {

            this.log("command received   ", data.command);
            Homey.app.EWSignal.processSendCommand({ pair: true, 'channel': channel, 'command': data.command })
        });

        socket.on('saveChannel', data => {

            this.log(`on save channel     ${util.inspect(data)}       `)
            let message = {}

            if (helpFunctions.containsChannel(this.devicesData, data.channel)) {

                socket.emit('same',message)
                this.log(`socket emit same`)
                channel = data.channel

            }
            else {
                socket.emit('notSame',message)
                this.log(`socket emit notsame`)
                channel = data.channel
            }


        })



        // called frm easywave decoding
        this.recieveAnswerToPair = (answer) => {
            this.log(`this.recieveAnswerToPair answer   ${answer}    `)
            socket.emit('pairAnswer', { "answer": answer });
        }




        socket.on("done", (data, callback) => {



            if (Homey.app.rfxcomDeviceTypes[type] != null) {
                // Check the checksum before we start decoding
                capabilities = Homey.app.rfxcomDeviceTypes[type].capabilities
                protocol = Homey.app.rfxcomDeviceTypes[type].data.protocol

                this.log(' capabilities ', util.inspect(capabilities))
                this.log(' protocol ', util.inspect(protocol))


            }



            let devicedata = {
                id: `EW${channel}`,             // old id was rfxcom ms13 housecode unitcode same as name 
                houseCode: channel,
                unitCode: channel,
                protocol: protocol,
                type: type

            }

            let virtualDeviceClass = ``

            let filledDevice = new Fdevice(devicedata, driver, capabilities, virtualDeviceClass)







            // callback(null, filledDevice);


            this.log(` ${driver} pair done this filledDevice `, util.inspect(filledDevice));
            this.log('drivr 174 add filledDevice.data.id ', filledDevice.data.id)


            // this.log(`callback     ${util.inspect(callback,true,0)}`)



            // a devie then also a name is passed
            callback(null, filledDevice);


            //   this.log(`callback     ${util.inspect(this, true, 0)}`)


            // homey specifik acceps only dd
            //this.added(filledDevice.data, callback)








            // }
        });

        //TODO  is compute device necessary , in presenting dat from recievers a device is created, pairing mkes alreadx a device


        socket.on('disconnect', function () {

        })


    }


}

module.exports = EWDriver;