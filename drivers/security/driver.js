'use strict';

const Homey = require('homey');


class securityDriver extends Homey.Driver {


    onInit() {

        this.homeyDevices = []// Homey.app.homeyDevices
        this.log('temphum driver oninit this homeydevices', this.homeyDevices)

        this.devices = this.getDevices()
       // this.log('devices from getdevices  ', this.devices)
    }






    onPair(socket) {

        //socket.on('press_button', function (data, callback) {

        //    this.log('socket.on(press_buttonh  ');


        //        socket.emit('button_pressed');

        //        callback();
        //});

        this.log('pair this homeydevices', this.homeyDevices)

        socket.on('list_devices', (data, callback) => {
           
            callback(null, this.homeyDevices);

           
        });

        socket.on("add_device", (device, callback) => {


            this.log('drivr 174 add device', device)
            this.log('drivr 174 add device.data.id ', device.data.id)




           
            socket.emit('pairingdone', '', (err, result) => {
                this.log('pairing done result ', result) // Hi!
            });

        });




        socket.on('disconnect', function () {

        })






    }



}

module.exports = securityDriver;