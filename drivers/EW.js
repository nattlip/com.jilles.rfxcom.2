'use strict';

const Homey = require('homey');
const masterDriver = require('../lib/masterdriver/masterdriver.js');

const helpFunctions = require('../lib/helpFunctions.js').jan;
const convert = require('../lib/baseConverter.js').jan.ConvertBase;
const util = require('util');
const Fdevice = require('../lib/filledDevice.js');


class EWDriver extends Homey.Driver {//extends masterDriver {

    onInit() {






        this.answerToPairDeviceWithEW;
        this.devicesData = [];  // from drivers
        this.heardList = [];    // to be paired is list of devoicesdata. otherr device properties doesn matter
        this.devices = this.getDevices();                                                                                                 
        //this.log('devices from getdevices  ', util.inspect(this.devices,true,null))
        this.log(' driver id  ', this.id); 
        // this.log(`${this.id} devices       ${util.inspect(this.devices)}    `)

        for (let device of this.devices) {
            this.devicesData.push(device.getData());
        }
        this.log(`${this.id} devicesdata       ${util.inspect(this.devicesData)}    `); 

        this.sendParameters = {};




    } // on end init

    // pairing 
    // there are 64 channels hex =40 is a  byte 
    // start at 00 else next avalible hex as channel  // channel is hex to be send to EW transceiver


    onPair(socket) {

        this.log(`onpair entered`);
        let command = '';
        let houseCode = '2';
        let unitCode = '2';
        let type = 'EW';  // type of device eg visonicdoorsensor or ms13e
        let protocol = 'EW';
        let driver = this.id;
        let capabilities = [];
        this.log(`devices.length   ${this.devices.length}  `);
        let channel = '';
        // keep it a string , a string must be send

        let answerFromRx09 = '';
        let message = { message: 'here i am' };

        socket.showView('first');

        

        socket.on('showView', (viewId, callback) => {
            callback();
            this.log('viewId    ', viewId);
            if (viewId === 'first') {
                socket.emit('here', message);
            }
        });

        socket.on('saveChannel', (data, callback) => {



            let channelExist = "channel already exists";
            let channelNotExists = "channel doesnt exist yet";

            channel = data.channel;
            this.log(`on save channel     ${util.inspect(data)}       `);
            this.log(`channel to page =              ${channel}`);


           // callback(null,{ "result" : "savechannel"});

            
            if (helpFunctions.containsChannel(this.devicesData, channel)) {

                 callback(null,channelExist);

            }
            else {

                 callback(null,channelNotExists);

            }



            

        });

        // temp for testing
        // channel = '01'


        // Homey.emit('sendUpCommand', { "command": 'up' });

        socket.on('sendCommand', (data,callback) => {

           
            this.log('entered socked on sendcommand');
            this.log("command received   ", data);
            //socket.showView('second');
            Homey.app.EWSignal.processSendCommand({ pair: true, 'channel': channel, 'command': data.command });
            callback(null, answerFromRx09);
           
        });

        


        this.reportchanneltopage = () => {

            

            if (helpFunctions.containsChannel(this.devicesData, channel)) {
                socket.on('showView', (viewId, callback) => {
                    callback();
                    this.log('viewId    ', viewId);
                    if (viewId === 'first') {
                        socket.emit('same', message);
                    }
                });

                this.log(`socket emit same`);


            }
            else {
                socket.on('showView', (viewId, callback) => {
                    callback();
                    this.log('viewId    ', viewId);
                    if (viewId === 'first') {
                        socket.emit('notSame', message);
                    }
                });
                this.log(`socket emit notsame`);

            }

        };
       



        // called frm easywave decoding
        this.recieveAnswerToPair = (answer) => {
            this.log(`type of answer to  ${typeof answer} `);
            this.log(`this.recieveAnswerToPair answer   ${answer}    `);
            this.log(`answer === 'OK'  ${ answer.toString() === 'OK'}    `);


            answerFromRx09 = answer;
            
                //this.log('answer is OK');
                //socket.on('showView', (viewId, callback) => {
                //    callback();
                //    this.log('viewId    ', viewId);
                //    if (viewId === 'first') {
                //        socket.emit('pairAnswer', { answer: answer });
                //    }
                //});

            





            
        };

        






        socket.on("done", (data, callback) => {



            if (Homey.app.rfxcomDeviceTypes[type] !== null) {
                // Check the checksum before we start decoding
                capabilities = Homey.app.rfxcomDeviceTypes[type].capabilities;
                protocol = Homey.app.rfxcomDeviceTypes[type].data.protocol;
                   
                this.log(' capabilities ', util.inspect(capabilities));
                this.log(' protocol ', util.inspect(protocol));


            }



            let devicedata = {
                id: `EW${channel}`,             // old id was rfxcom ms13 housecode unitcode same as name 
                houseCode: channel,
                unitCode: channel,
                protocol: protocol,
                type: type

            };

            let virtualDeviceClass = ``;

            let filledDevice = new Fdevice(devicedata, driver, capabilities, virtualDeviceClass);







            // callback(null, filledDevice);


            this.log(` ${driver} pair done this filledDevice `, util.inspect(filledDevice));
            this.log('drivr 174 add filledDevice.data.id ', filledDevice.data.id)
                ;

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

        });


    }


}

module.exports = EWDriver;