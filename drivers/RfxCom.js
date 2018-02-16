
'use strict';

const Homey = require('homey');

class RfxComDriver extends Homey.Driver {

    onInit() {

        this.sendParametersTypes = Array.from(Homey.app.RxTxTypesMap.values())
        this.log(`sendParametersTypes   ${this.sendParametersTypes}   `)
    }



    onPair(socket) {


        socket.emit('sendParametersTypes', { 'sendParametersTypes': this.sendParametersTypes });


        socket.on('start', function (data, callback) {
            console.log('pairing')
            callback(null, 'Started!');
        });







    }



}

module.exports = RfxComDriver;