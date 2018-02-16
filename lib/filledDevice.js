"use strict"

//const libClass = require('./libClass.js');
//const path = require('path');
const util = require('util');
const Homey = require('homey'); 


class filledDevice  {

    constructor(data, driver,  capabilities,virtualClass) {

       

        //this.filename = path.basename(__filename)
        //this.dirname = path.basename(__dirname);



        //Homey.app.log(`filled device ${util.inspect(Homey,true,0) }`)

         Homey.app.log(`filled device ${util.inspect(Homey.dir,true,0) }`)

        //this.debug = true;//  to set debug on or off
        //this.lib = new libClass();
        //this.lib.log = this.lib.log.bind(this);

        //this.lib.log(` ${this.constructor.name}  is this. `);
        //this.debug = true
        //this.lib.log(` dir   ${this.dirname}  file ${this.filename} `);


        //let absolutePath = path.resolve("filledDevice.js");
        //this.lib.log(` ${this.absolutePath}  absolutepath. `);

        //this.lib.log('module.filename filleddevice', module.filename)

        //this.lib.log(`app manifest      ${util.inspect(Homey.app.manifest,true,null)}                   ` )
        //  this.icon = '../drivers/X10/assets/onoff.svg'
        // this.icon = './X10/assets/onoff.svg'
        //this.icon = "/drivers/X10/assets/onoff.svg"
      //  this.icon = `rivers/X10/assets/onoff.svg`

        //  this.icon = 'onoff.svg'
      
        //this.icon = "/assets/icons/onoff.svg" 
        
         let iconPath = `/app/com.jilles.rfxcom.2/drivers/${driver}/assets/icons/`
         if (data.type == 'OnOff') {
             this.class = 'socket'
             this.icon = iconPath + 'onoff.svg'

             if(virtualClass !== 'none')
                this.virtualClass = virtualClass
         }
         if (data.type == 'Dim') {
             this.class = 'light'
             this.icon = iconPath + 'Dim.svg'
         }
         if (data.type == 'MS13E') {
             this.class = 'sensor'
             this.icon = iconPath + 'MS13.svg'
         }
         if (data.type == 'EW') {
             this.class = 'windowcoverings'
             this.icon = iconPath + 'rollershutter.svg'
             //this.icon = iconPath + 'MS13.svg'
         }
        this.driver = driver,
        this.data = data // = devicedata
        this.rx = []
        this.tx = []
        if (data.protocol == 'X10') { this.name = Homey.app.app + data.protocol + data.type + data.houseCode + data.unitCode }
        if (data.protocol == 'visonic') { this.name = data.address }
        if (data.protocol == 'EW') { this.name = data.id }

        this.capabilities = capabilities
        this.capability = {}
        this.capability = Object.assign(this.capability, this.capabilities.forEach(c => this.capability[c] = false))
        this.settings = { id: data.id }
        
     
        









    }







}

module.exports = filledDevice