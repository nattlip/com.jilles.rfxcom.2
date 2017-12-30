
'use strict';

const Homey = require('homey');

class RfxComDriver extends Homey.Driver {


    onPair(socket) {
        socket.on('start', function (data, callback) {
            console.log('pairing')
            callback(null, 'Started!');
        });







    }

   

}

module.exports = RfxComDriver;