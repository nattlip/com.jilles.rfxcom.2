'use strict';

const Homey = require('homey');


class oregonDriver extends Homey.Driver {


    onInit() {

        this.homeyDevices = []// Homey.app.homeyDevices
        this.log('oregon driver oninit this homeydevices', this.homeyDevices)

        this.devices = this.getDevices()
        //  this.log('devices from getdevices  ', this.devices )
    }






    onPair(socket) {

        //socket.on('press_button', function (data, callback) {

        //    console.log('socket.on(press_buttonh  ');


        //        socket.emit('button_pressed');

        //        callback();
        //});

        this.log('pair this homeydevices', this.homeyDevices)

        socket.on('list_devices', (data, callback) => {


            // console.log('devise length  ' , homeyDevices.length)
            // err, result style
            callback(null, this.homeyDevices);

            // even when we found another device, these can be shown in the front-end
            //setTimeout(function () {
            //    socket.emit('list_devices', moreDevices)
            //}, 2000)


        });

        socket.on("add_device", (device, callback) => {


            console.log('drivr 174 add device', device)
            console.log('drivr 174 add device.data.id ', device.data.id)




            //  console.log('driver 180 device data' , device_data)

            //   console.log('device onoff', circle)
            //var deviceObj = false;
            //devices.forEach(function (installed_device) {

            //    // If already installed
            //    if (installed_device.uuid == device.data.id) {
            //        deviceObj = installed_device;
            //    }
            //});

            //// Add device to internal list
            //devices.push(device.data);

            //// Mark as offline by default
            //module.exports.setUnavailable(device.data, "Offline");

            //// Conntect to the new Device
            //Homey.app.connectToDevice(devices, device.data, function (err, device_data) {

            //    // Mark the device as available
            //    if (!err && device_data) module.exports.setAvailable(device_data);
            //});

            //// Empty found devices to prevent piling up
            //foundDevices = [];

            // Return success
            // addDevice(homeyoregondevice);

            var devicedataobj = { "id": device.data.id };

            // callback(null);
            callback(null, devicedataobj);
            socket.emit('pairingdone', '', (err, result) => {
                console.log(result) // Hi!
            });

        });




        socket.on('disconnect', function () {

        })






    }



}

module.exports = oregonDriver;