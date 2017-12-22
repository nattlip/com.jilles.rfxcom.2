'use strict';


const util = require('util');
const http = require('http.min');
const Homey = require('homey');

class masterDriver extends Homey.Driver
{

    

    onInit() {

        if (this.id == `slave`) {

            this.log(`init driver id :   ${this.id}    `)

            this.homeyDevices = []
            this.log(`${this.id} driver oninit this homeydevices   ${this.homeyDevices}  `)

            this.devices = this.getDevices()
            this.log(`devices from getdevices  ${this.devices} `)
        }
    }






    onPair(socket) {

        if (this.id == `slave`) {

            this.log('pair this homeydevices', this.homeyDevices)

            socket.on('list_devices', (data, callback) => {



                callback(null, this.homeyDevices);



            });

            socket.on("add_device", (device, callback) => {


                console.log('drivr 174 add device', device)
                console.log('drivr 174 add device.data.id ', device.data.id)


            });




            socket.on('disconnect', function () {

            })




        }

    }









}

module.exports = masterDriver