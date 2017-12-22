'use strict';



const http = require('http.min');
const Homey = require('homey');
const util = require('util');

const Transceiver = require('../rfxcom/RxTxRfxcom')

class masterDevice extends Homey.Device {


    // this method is called when the Device is inited
    //#region onInit

    onInit() {

        this.log('device init');
        this.log('device name:', this.getName());
        this.log('homey class name:', this.getClass());
        this.driver = this.getDriver().id
        this.log(`driver name id `, this.driver)
        this.class = this.getClass(); 
        this.log(`node driver classname in file `, this.getDriver().constructor.name)
        // this.log(`driver `, this.inspect(this.getDriver()))

        this.settings = this.getSettings();

        this.log(`this settings ${util.inspect(this.settings)}`)

        this.ip = this.settings.ip
        this.port = this.settings.port

        // data device object
        this.data = this.getData()

        this.log(`this.data   ${this.data}`)
        this.type = this.data.type
        this.protocol = this.data.protocol
        this.log(`this.type   ${this.type}`)
        this.log(` this.protocol   ${ this.protocol  }`)
        //#region class thermostat

        if (this.class == "thermostat") {

            this.polleri = 0
            this.pollInterval = 60000  // 1 minute
            this.polling = false
            this.thermostattested = false
            this.thermostatset = false  // 2 possibilizties not online not set correct
            this.thermostatconnected = true
            this.thermostatusername = ''
            this.thermostatpassword = ''
            this.thermostattesting = true


            this.thermostatusername = this.settings.user
            this.thermostatpassword = this.settings.password
            this.thermostattesting = true
            this.thermostatmethod = 'GET'
            // for nt10 averagge temp is temp1 local nt10
            this.thermostatTempCommand = 'OID4.1.13'
            // for nt20
            this.thermostatTempOneCommand = 'OID4.3.2.1'
            this.thermostatTempTwoCommand = 'OID4.3.2.2'
            this.thermostatTempThreeCommand = 'OID4.3.2.3'
            this.thermostatThermSetbackHeatCommand = 'OID4.1.5'
            this.thermostatThermHvacStateCommand = 'OID4.1.2'





        }


        //#endregion class thermostat 

        //#region driver rfxtrx


        if (this.driver == 'rfxtrx') {

            Homey.ManagerArp.getMAC(this.ip).then((mac) => {

                this.log(`rftrx device found with ip ${this.ip}  and mac ${mac} `)
            },

                (error) => {
                    this.log("request Failed!", error);
                }


            )




            this.RxTx = {
                id: this.ip,   // its ip for now must become mac 
                type: this.driver, // lan  with or without transmitterer / trnasmitter or trx //
                ip: this.ip,
                rx: this.port,  // or trx   its rx port
                tx: null, // its tx port not for rfxtrx
            }

            this.transceiver = new Transceiver(this.RxTx)




            //if (this.settings.mac) {
            //    this.log(`there is a settings.mac`)

            //    this.mac = this.settings.mac
            //}
        }

        //#endregion driver rfxtrx

        //#region driver lan

        if (this.driver == 'lan') {

            Homey.ManagerArp.getMAC(this.ip).then((mac) => {

                this.log(`rftrx device found with ip ${this.ip}  and mac ${mac} `)
            },

                (error) => {
                    this.log("request Failed!", error);
                }


            )




            this.RxTx = {
                id: this.ip,   // its ip for now must become mac 
                type: this.settings.lanType, // lan  with or without transmitterer / trnasmitter or trx //
                ip: this.ip,
                rx: this.settings.rxPort,  // or trx   its rx port
                tx: this.settings.txPort // its tx port not for rfxtrx
            }

            this.transceiver = new Transceiver(this.RxTx)




            //if (this.settings.mac) {
            //    this.log(`there is a settings.mac`)

            //    this.mac = this.settings.mac
            //}
        }

        //#endregion  driver lan

        //#region driver nt10 or nt20 

        if (this.driver == 'nt10') {

            this.thermostatGetCommand = `/get?${this.thermostatTempCommand}\
=&${this.thermostatThermSetbackHeatCommand}\
=&${this.thermostatThermHvacStateCommand}=` // = path in req
            // this.registerCapabilityListener('measure_temperature', this.onCapabilityMeasure_temperature.bind(this))


        }

        else if (this.driver == 'nt20') {

            this.thermostatGetCommand = `/get?${this.thermostatTempOneCommand}\
=&${this.thermostatTempTwoCommand}\
=&${this.thermostatTempThreeCommand}\
=&${this.thermostatThermSetbackHeatCommand}\
=&${this.thermostatThermHvacStateCommand}=` // = path in req

            this.registerCapabilityListener('measure_temperature_one', this.onCapabilityMeasure_temperature_one.bind(this))
            this.registerCapabilityListener('measure_temperature_two', this.onCapabilityMeasure_temperature_two.bind(this))
            this.registerCapabilityListener('measure_temperature_three', this.onCapabilityMeasure_temperature_three.bind(this))


        }



        if (this.class == "thermostat")
        // register a capability listener
        {
            this.registerCapabilityListener('target_temperature', this.onCapabilityTarget_temperature.bind(this))
            this.registerCapabilityListener('thermostat_mode', this.onCapabilityThermostat_mode.bind(this))
        }

        //#endregion  nt10 or nt20 

        //#region driver protocol x10

        //if (this.class == "socket" || this.class == "light")
        if (this.driver == 'X10')
        {
            if (this.type == "OnOff" || this.type == 'Dim')
            // register a capability listener
            {

                // if (this.getVirtualClass)
                this.log(`this.class x10    ${this.class}   `)

                this.onCapabilityOnoff = (value, opts, callback) => {
                    let X10Command = ''
                    // ... set value to real device
                    this.log(`value send onff   ${value} `)

                    if (value == true) {
                        X10Command = 'on';
                    }
                    else if (value == false) {
                        X10Command = 'off';
                    }

                    let sendCommand = {
                        'houseCode': this.data.houseCode,
                        'unitCode': this.data.unitCode,
                        'X10Command': X10Command
                    }
                    //  signal.emit('sendCommand', sendCommand)
                    this.log(` sendcommand onoff  ${sendCommand}`)
                    Homey.app.X10LanSignal.processSendCommand(sendCommand)

                    // Then, emit a callback ( err, result )
                    callback(null);
                    // or, return a Promise
                    return Promise.reject(new Error('Switching the device failed!'));
                }
              
                this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))

            }

            if (this.type == 'Dim')
            {
                this.onCapabilityDim = (value, opts, callback) => {


                    let dimDevice = this.getCapabilityValue('dim')


                    // if dim device < set dim  command = bright else dim 
                    let deltaDevDimComDim = dimDevice - value
                    let X10Command = ''


                    if (deltaDevDimComDim > 0)  // command = dim   device is brighter as command dim
                    {

                        X10Command = 'dim';


                    }
                    else if (deltaDevDimComDim < 0) // // command = bright   device is dimmer as command dim
                    {

                        X10Command = 'bright';

                    }


                    let sendCommand = {
                        'houseCode': this.data.houseCode,
                        'unitCode': this.data.unitCode,
                        'X10Command': X10Command
                    }
                    //  signal.emit('sendCommand', sendCommand)

                    this.log(` sendcommand dim  ${sendCommand }`)
                    Homey.app.X10LanSignal.processSendCommand(sendCommand)

                    // Then, emit a callback ( err, result )
                    callback(null);
                    // or, return a Promise
                    return Promise.reject(new Error('Switching the device failed!'));
                }

                this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this))
                   // this.log(`device class socket  ${util.inspect(this,true,30)}`)
            }

            if (this.type == 'MS13E')
            {
                this.registerCapabilityListener('alarm_motion', this.onCapabilityAlarm_motion.bind(this))
                this.registerCapabilityListener('alarm_night', this.onCapabilityAlarm_night.bind(this))

            }




        }


        //#endregion class socket ie x10

        //#region class thermostat



        if (this.class == "thermostat") {


            this.thermostatusername = this.settings.user
            this.thermostatpassword = this.settings.password




            this.log(`settings `, this.settings)


            // check if thermostat is set
            if (!(this.ip == undefined) && !(this.port == undefined) && !(this.thermostatusername == undefined) && !(this.thermostatpassword == undefined)) {
                this.thermostatset = true;

                this.log('test if thermostat is set this.thermostatset =  ', this.thermostatset);
                this.pollproliphix();
            } else {
                this.thermostatset = false;
                this.log('test if thermostat is set this.thermostatset =  ', this.thermostatset);
            }




            // test thermostat 
            if (!(this.ip == null) && !(this.port == null) && !(this.thermostatusername == null) && !(this.thermostatpassword == null)) {
                this.req(this.ip, this.port, this.thermostatGetCommand, this.thermostatmethod, this.thermostatusername, this.thermostatpassword);
                this.polleri += 1
            };




        }

        //#endregion class thermostat

        //#region driver TEMPHUM

        if (this.driver == 'TEMPHUM') {
            this.checkUpdateInterval = 30000
            this.homeyDevices = []// Homey.app.homeyDevices
            this.log('temphum device oninit this homeydevices', this.homeyDevices)

            this.checkupdate()



        }

        //#endregion driver TEMPHUM

        //#region security

        if (this.driver == 'security') {
            this.checkUpdateInterval = 30000
            this.homeyDevices = []// Homey.app.homeyDevices
            this.log('security device oninit this homeydevices', this.homeyDevices)





        }
        //    this.setSettings({
        //        ip: "newValue",
        //        // only provide keys for the settings you want to change
        //    })
        //        .then(this.log)
        //        .catch(this.error)


   

    //#endregion security


    // this method is called when the Device is added

        if (!this.driver == 'X10') {

            // this method is called when the Device is added
            this.onAdded = () => {
                this.log('device added');
                // this.log(`util inspect this    ${util.inspect(this,true,8)}`)
            }


        }










    }  // end oninit 

    //#endregion onInit

    //run when user changed settings
    onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {


        this.log(`oldSettingsObj      ${util.inspect(oldSettingsObj)}          `)
        this.log(` newSettingsObj     ${util.inspect(newSettingsObj)}          `)
        this.log(` changedKeysArr     ${changedKeysArr}          `)


        this.RxTx = {
            id: newSettingsObj.ip,   // its ip for now must become mac 
            type: this.driver, // lan  with or without transmitterer / trnasmitter or trx //
            ip: newSettingsObj.ip,
            rx: newSettingsObj.port,  // or trx   = its rx port
            tx: null, // its tx port not for rfxtrx
        }

        if (this.transceiver.clientRx) {
            this.transceiver.clientRx.destroy()
            this.log(`clientRx destroyed`)
        }
        delete this.transceiver
        this.transceiver = new Transceiver(this.RxTx)






        // run when the user has changed the device's settings in Homey.
        // changedKeysArr contains an array of keys that have been changed

        // always fire the callback, or the settings won't change!
        // if the settings must not be saved for whatever reason:
        // callback( "Your error message", null );
        // else
        callback(null, true);
    }


    
    // this method is called when the Device is deleted
    onDeleted() {
        this.log('device deleted');
    }

    //nt10
    // this method is called when the Device has requested a state change (turned on or off)
    //onCapabilityMeasure_temperature  (value, opts, callback)  {

    //    // ... set value to real device

    //    // Then, emit a callback ( err, result )

    //    this.log('temp changed in ', value)



    //    callback(null);

    //    // or, return a Promise
    //    return Promise.reject(new Error('Switching the device failed!'));
    //}

    //nt20

    




    onCapabilityMeasure_temperature_one(value, opts, callback) {

        // ... set value to real device

        // Then, emit a callback ( err, result )
        callback(null);

        // or, return a Promise
        return Promise.reject(new Error('Switching the device failed!'));
    }

    onCapabilityMeasure_temperature_two(value, opts, callback) {

        // ... set value to real device

        // Then, emit a callback ( err, result )
        callback(null);

        // or, return a Promise
        return Promise.reject(new Error('Switching the device failed!'));
    }

    onCapabilityMeasure_temperature_three(value, opts, callback) {

        // ... set value to real device

        // Then, emit a callback ( err, result )
        callback(null);

        // or, return a Promise
        return Promise.reject(new Error('Switching the device failed!'));
    }



    onCapabilityTarget_temperature(value, opts, callback) {

        // ... set value to real device
        this.log(` onCapabilityTarget_temperature fired with value`, value)
        this.log(` onCapabilityTarget_temperature fired with opts`, opts)

        // return (5 / 9) * c + 32

        let valueNumber = Number(value)

        this.log(`valueNumber `, valueNumber)

        let fahrenheid = ((((9 / 5) * valueNumber + 32)).toFixed(0)) * 10

        this.log(`fahrenheid `, fahrenheid)

        let path = `/pdp?OID4.1.5=${fahrenheid}&submit=Submit`
        let method = 'POST'

        this.req(this.ip, this.port, path, method, this.thermostatusername, this.thermostatpassword)



        // Then, emit a callback ( err, result )
        callback(null);

        // or, return a Promise
        return Promise.reject(new Error('Switching the device failed!'));





    }





    onCapabilityThermostat_mode(value, opts, callback) {

        // ... set value to real device
        this.log(` onCapabilityThermostat_mode fired with value`, value)
        this.log(` onCapabilityThermostat_mode fired with opts`, opts)
        // Then, emit a callback ( err, result )
        callback(null);

        // or, return a Promise
        return Promise.reject(new Error('Switching the device failed!'));
    }








    // if socket is reachable
    pollproliphix() {
        this.log('entered pollproliphix')

        this.log('pollproliphix polleri before', this.polleri);

        this.log('pollproliphix  this.thermostatset', this.thermostatset);
        this.log('pollproliphix  this.testthermostat', this.thermostattested);
        this.log('pollproliphix  this.thermostatconnected', this.thermostatconnected);


        this.torepeat = () => {
            this.polleri += 1;
            this.log('pollproliphix polleri before', this.polleri);

            this.log('pollproliphix  this.thermostatset', this.thermostatset);
            this.log('pollproliphix  this.testthermostat', this.thermostattested);
            this.log('pollproliphix  this.thermostatconnected', this.thermostatconnected);


            if (this.thermostatset && this.thermostatconnected) {

                this.req(this.ip, this.port, this.thermostatGetCommand, this.thermostatmethod, this.thermostatusername, this.thermostatpassword);

            };
            this.log('pollproliphix polleri after ', this.polleri);


        };


        this.toset = setInterval(() => { this.torepeat() }, this.pollInterval);

    }






    req(ip, port, command, method, username, password) {

        let path = command

        let options = {

            protocol: 'http:',
            hostname: ip,
            port: port,
            path: path,
            method: method,
            auth: username + ':' + password,
            timeout: 3000,
            headers: {
                'User-Agent': 'Node.js http.min'
            }

        }

        this.log(' before req http  min to be executed options  ', options);

        http(options).then((result) => {
            this.log(' result rsponse code   ', result.response.statusCode);

            if (result.response.statusCode == 200) {
                if (method == 'GET')

                { this.resolveGet(result) }

                else if (method == 'POST')

                { this.resolvePost(result) }
            }
        },
            (error) => {
                this.log("request Failed!", error);
            }

        )
    }  // end req2

    resolveGet(result) {



        this.log(' result   ', result.data);



        if (this.driver == 'nt10') {

            this.log(' result nt10  ');

            // average temp
            let is2 = result.data.indexOf(`ID4.1.13=`)
            let strippedresult2 = result.data.slice(is2 + 1 + 8, is2 + 12)
            this.log(`strippedresult2 req`, strippedresult2)
            let answer2 = parseInt(strippedresult2)
            this.log(`int strippedresult2 `, parseInt(strippedresult2))
            let temp = (((answer2 / 10) - 32) / 1.8).toFixed(2)
            this.log(`temperature`, `  ${temp}  Celsius`)
            this.setCapabilityValue(`measure_temperature`, Number(temp))


        }

        else if (this.driver == 'nt20') {
            this.log(' result if nt20  ');
            // temp1
            let is = result.data.indexOf(`OID4.3.2.1=`)
            let strippedresult = result.data.slice(is + 1 + 10, is + 14)
            this.log(`strippedresult req`, strippedresult)
            let answer = parseInt(strippedresult)
            this.log(`int strippedresult `, parseInt(strippedresult))
            let temp = (((answer / 10) - 32) / 1.8).toFixed(2)
            this.log(`temperature 1`, `  ${temp}  Celsius`)
            this.setCapabilityValue(`measure_temperature_one`, Number(temp))

            // temp 2
            let is1 = result.data.indexOf(`OID4.3.2.2=`)
            let strippedresult1 = result.data.slice(is1 + 1 + 10, is1 + 14)
            this.log(`strippedresult1 req`, strippedresult1)
            //if (strippedresult1[0] == "-")
            //{ strippedresult1[0] = 0 } 
            let answer1 = parseInt(strippedresult1)
            this.log(`int strippedresult1 `, parseInt(strippedresult1))
            let temp1 = (((answer1 / 10) - 32) / 1.8).toFixed(2)
            this.log(`temperature 1`, `  ${temp1}  Celsius`)
            this.setCapabilityValue(`measure_temperature_two`, Number(temp1))

            // temp 3
            let is2 = result.data.indexOf(`OID4.3.2.3=`)
            let strippedresult2 = result.data.slice(is2 + 1 + 10, is2 + 14)
            this.log(`strippedresult2 req`, strippedresult2)
            //if (strippedresult2[0] == "-")
            //{ strippedresult2[0] = 0 } 
            let answer2 = parseInt(strippedresult2)
            this.log(`int strippedresult2 `, parseInt(strippedresult2))
            let temp2 = (((answer2 / 10) - 32) / 1.8).toFixed(2)
            this.log(`temperature`, `  ${temp2}  Celsius`)
            this.setCapabilityValue(`measure_temperature_three`, Number(temp2))

        }


        this.callback = () => { this.log(' callback    ') }



        // target temp
        let is3 = result.data.indexOf(`ID4.1.5=`)
        let strippedresult3 = result.data.slice(is3 + 1 + 7, is3 + 11)
        this.log(`strippedresult3 req`, strippedresult3)
        let answer3 = parseInt(strippedresult3)
        this.log(`int strippedresult3 `, parseInt(strippedresult3))
        let thermSetbackHeat = (((answer3 / 10) - 32) / 1.8).toFixed(2)
        this.log(`thermSetbackHeat`, ` ${thermSetbackHeat} `)
        //if (thermSetbackHeat = '3,5')
        //{ thermSetbackHeat = '4' }
        //this.setCapabilityValue(`target_temperature`, Number(thermSetbackHeat))
        this.setCapabilityValue(`target_temperature`, Number(thermSetbackHeat), this.callback)



        // hvac state 
        let is4 = result.data.indexOf(`ID4.1.2=`)
        let strippedresult4 = result.data.slice(is4 + 1 + 7, is4 + 9)
        this.log(`strippedresult4 req`, strippedresult4)
        let answer4 = strippedresult4
        this.log(`int strippedresult4 `, strippedresult4)
        let thermHvacState = ``
        switch (answer4) {
            case "1":
                thermHvacState = `off`
                break;
            case "2":
                thermHvacState = `off`
                break;
            case "3":
                thermHvacState = `heat`
        }
        this.log(`thermHvacState`, ` ${thermHvacState} `)
        this.setCapabilityValue(`thermostat_mode`, thermHvacState)

    }

    resolvePost(result) {

        let is3 = result.data.indexOf(`ID4.1.5=`)
        let strippedresult3 = result.data.slice(is3 + 1 + 7, is3 + 11)
        this.log(`strippedresult3 req`, strippedresult3)
        let answer3 = parseInt(strippedresult3)
        this.log(`int strippedresult3 `, parseInt(strippedresult3))
        let thermSetbackHeat = (((answer3 / 10) - 32) / 1.8).toFixed(2)
        this.log(`thermSetbackHeat set by Homey `, ` ${thermSetbackHeat} `)
        this.setCapabilityValue(`target_temperature`, Number(thermSetbackHeat))



    }



    checkupdate() {



        this.torepeat = () => {

            //now
            let date = new Date()


            this.settings = this.getSettings();
            this.log(`this.settings ${util.inspect(this.settings)}`)

            this.log(`this.settings.lastUpdateSensor ${util.inspect(this.settings.lastUpdateSensor)}`)

            let oldDate = Date.parse(this.settings.lastUpdateSensor)

            this.log(`oldDate ${oldDate}`)

            let deltatime = date - oldDate

            this.log(`deltatime ${deltatime}`)

            let deltadate = new Date(deltatime)

            this.log(`deltaDate ${deltadate}`)



            let returnHumanDateString = (date) => {

                let day = date.getDate()
                let month = date.getMonth() + 1 // zero indexed 
                let year = date.getFullYear()
                let hour = date.getHours()
                let minute = date.getMinutes()
                let second = date.getSeconds()

                this.log(`local date ${day}-${month}-${year} , local time  ${hour} : ${minute}  : ${second}`)
                let absoluteDateTime = `${day}-${month}-${year} ${hour}:${minute}:${second}`


                return `${year}-${month}-${day}T${hour}:${minute}:${second}`

            }


            let returnDeltaTime = (deltadate) => {

                let diff = Math.abs(Math.floor(deltadate) / 1000);

                let days = Math.floor(diff / (24 * 60 * 60));
                let leftSec = diff - days * 24 * 60 * 60;

                let hrs = Math.floor(leftSec / (60 * 60));
                leftSec = leftSec - hrs * 60 * 60;

                let min = Math.floor(leftSec / (60));
                leftSec = leftSec - min * 60;

                return `days ${days} hours ${hrs}  minutes ${min}  sec ${leftSec}`
            }

            // settings
            // humanDateString  = absoluteDateTime
            // date()   = date   to compare with new date
            // deltaTime  =      deltaDateTime




            this.setSettings({
                deltaDateTime: returnDeltaTime(deltadate)



            })
                .then(this.log(`deltatime ` + returnDeltaTime(deltadate)))
                .catch(this.error)



        };


       // this.toset = setInterval(() => { this.torepeat() }, this.checkUpdateInterval);

    }

    updateCapabilitiesOregon(HD) {


        let date = new Date()

        //https://stackoverflow.com/questions/38701847/how-can-i-convert-a-date-into-an-integer



        let returnHumanDateString = (date) => {

            let day = date.getDate()
            let month = date.getMonth() + 1 // zero indexed 
            let year = date.getFullYear()
            let hour = date.getHours()
            let minute = date.getMinutes()
            let second = date.getSeconds()

            this.log(`local date ${day}-${month}-${year} , local time  ${hour} : ${minute}  : ${second}`)
            let absoluteDateTime = `${day}-${month}-${year} ${hour}:${minute}:${second}`


            return `${year}-${month}-${day}T${hour}:${minute}:${second}`

        }

        this.log(`return of returnHumanDateString ` + returnHumanDateString(date))







        // in msec


        this.log(`type of date ${typeof date.getTime()}  value of    ${date.getTime()}  `)

        let time = date.getTime()  //b gives msec

        this.log(`time  ${time} `)




        //this.log(`timems  ${util.inspect(timems)} `)

        this.setSettings({
            lastUpdateSensor: returnHumanDateString(date),
            date: date.toString()


        })
            .then(this.log(`set setting Date.parse(date)   ` + Date.parse(date)))
            .catch(this.error)












        if (this.driver == 'TEMPHUM') {

            this.log(`this is device with driver id  ${this.getDriver().id}`)
            this.log('info from oregon device HD  ', HD)


            this.setCapabilityValue(`measure_temperature`, HD.capability.measure_temperature)
            this.setCapabilityValue(`measure_humidity`, HD.capability.measure_humidity)
            this.setCapabilityValue(`alarm_battery`, HD.capability.alarm_battery)
        }
    }



    updateCapabilitiesVisonic(HD) {


        let date = new Date()

        //https://stackoverflow.com/questions/38701847/how-can-i-convert-a-date-into-an-integer



        let returnHumanDateString = (date) => {

            let day = date.getDate()
            let month = date.getMonth() + 1 // zero indexed 
            let year = date.getFullYear()
            let hour = date.getHours()
            let minute = date.getMinutes()
            let second = date.getSeconds()

            this.log(`local date ${day}-${month}-${year} , local time  ${hour} : ${minute}  : ${second}`)
            let absoluteDateTime = `${day}-${month}-${year} ${hour}:${minute}:${second}`


            return `${year}-${month}-${day}T${hour}:${minute}:${second}`

        }

        this.log(`return of returnHumanDateString ` + returnHumanDateString(date))







        // in msec


        this.log(`type of date ${typeof date.getTime()}  value of    ${date.getTime()}  `)

        let time = date.getTime()  //b gives msec

        this.log(`time  ${time} `)




        //this.log(`timems  ${util.inspect(timems)} `)

        this.setSettings({
            lastUpdateSensor: returnHumanDateString(date),
            date: date.toString()


        })
            .then(this.log(`set setting Date.parse(date)   ` + Date.parse(date)))
            .catch(this.error)












        if (this.driver == 'slave') {

            this.log(`this is device with driver id  ${this.getDriver().id}`)
            this.log('info from oregon device HD  ', HD)

            if (HD.type == 'visonicMotionSensor') {
                this.setCapabilityValue(` "alarm_contact"`, HD.capability.alarm_contact)
                this.setCapabilityValue(`alarm_tamper`, HD.capability.alarm_tamper)
                this.setCapabilityValue(`alarm_battery`, HD.capability.alarm_battery)
            }
        }
    }

    


    processX10LanResult(result)  {

    this.manageHeardList(result)
    this.manageHomeyDevices(result)



    this.log('signal X10 Lan result arrived in app ', util.inspect(result, true, null));


    //  this.triggerflow(result);
    this.log('signal X10 Lan devicesData ', util.inspect(this.devicesData, false, null));
    this.log('signal X10 Lan homeydevices ', util.inspect(this.homeyDevices, false, null));
    // d is deviceData cherck if device isd paired and whoich it is



    let app = this.app;
    let driver = result.data.driver;
    let capabilities = result.capabilities;


    for (let dd of this.devicesData) {
        // if (d.houseCode === result.data.houseCode && d.unitCode === result.data.unitCode) {
        if (dd.houseCode === result.data.houseCode
            && dd.unitCode === result.data.unitCode) {
            this.log('deviceData found corresponding ', util.inspect(dd, false, null));
            let d = this.homeyDevices[dd.id]
            let c = result.capabilities[0]   //"alarm_motion"


            //(app, driver, capabilities, device, capability, boolean:value)
            //driverMS13E.updateCapabilitiesHomeyDevice(app,driver,capabilities,homeyDevice,capability,result.command)
            //this.X10LanUpdate(app, result,c)
            if (driver == 'MS13E') {
                this.update(app, d, c, result.capability[c])
            }
            else {
                let capabilities = d.capabilities;

                //capabilities.forEach
                for (let ca of capabilities) {

                    // ... do something with c...                          
                    this.log(' let c of capabilities         ', ca)
                    this.log(' homeyDevice.capability[c]       ', d.capability[ca])
                    this.log(' hresult.capability[c]       ', result.capability[ca])

                    this.update(app, d, ca, result.capability[ca])


                }


            }

        }


        else if (dd.houseCode === result.data.houseCode
            && Number(dd.unitCode) === (Number(result.data.unitCode) - 1)
            && driver === 'MS13E') {

            this.log('homeyDevice found corresponding MS13E alarm night  ', util.inspect(dd, false, null));
            let d = this.homeyDevices[dd.id]
            let c = result.capabilities[1]

            //(app, driver, capabilities, device, capability, boolean:value)
            //  this.X10LanUpdate(app, result, c)
            this.update(app, d, c, result.capability[c])
            //driverMS13E.updateCapabilitiesHomeyDevice(app,driver,capabilities,homeyDevice,capability,result.command)
        }


    }

};  // end x10






}




module.exports = masterDevice