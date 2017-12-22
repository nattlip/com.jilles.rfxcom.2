
'use strict';

const Homey = require('homey');

class rfxTrxDriver extends Homey.Driver {


    onPair(socket) {
        socket.on('start', function (data, callback) {
            console.log('pairing')
            callback(null, 'Started!');
        });







    }

   

}

module.exports =rfxTrxDriver;