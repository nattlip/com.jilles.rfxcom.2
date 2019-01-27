
'use strict';

const Homey = require('homey');

class RfxComDriver extends Homey.Driver {

    onInit() {

        this.sendParametersTypes = Array.from(Homey.app.RxTxTypesMap.values());
        this.log(`sendParametersTypes   ${this.sendParametersTypes}   `);
    }



    onPair(socket) {

        this.log(`sendParametersTypes  onpair ${this.sendParametersTypes}   `);

        //socket.emit('sendParametersTypes', { 'sendParametersTypes': this.sendParametersTypes },  (err, result) =>{
        //    this.log(result)        });


        socket.on('showView', (viewId, callback) => {
            callback();
            this.log('viewId    ', viewId);
            if (viewId === 'start') {
                socket.emit('sendParametersTypes', { 'sendParametersTypes': this.sendParametersTypes });
            }
        });


                                          

        socket.emit('hello', 'Hello to you!');

        socket.on('start', (data, callback) => {
            this.log('pairing');
            this.log(`pairing  data from start  ${data.jan}`);
        });


        socket.on('test', (data, callback) => {
            this.log('test');
            callback(null, 'Started test!');
        });




    }



}

module.exports = RfxComDriver;