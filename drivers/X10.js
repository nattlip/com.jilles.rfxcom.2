'use strict';

const Homey = require('homey');
const masterDriver = require('../lib/masterdriver/masterdriver.js')

const helpFunctions = require('../lib/helpFunctions.js').jan;

const util = require('util');
const Fdevice = require('../lib/filledDevice.js')

class X10Driver extends Homey.Driver {//extends masterDriver {

    onInit() {

       this.scriptfunction = `

   function makehtml()
        {

            var z;

            var x = document.getElementById("text").parentElement.nodeName;



            var y = document.getElementsByClassName("view-content");

            // alert(y.length);
           

            z = y[0];

            var alphabet = "abcdefghijklmnop".split("");
            var alphabetCount = 16
        

            var houseCodes = document.createElement("select");
            houseCodes.className = "button";
            //<option value="" disabled selected style="display:none;">Label</option>
            var zeroOption = new Option("HouseCode", "0");
            houseCodes.options[houseCodes.options.length] = zeroOption;
            for (var i = 1; i <= alphabetCount ; i++)
            {
                houseCodes.options[houseCodes.options.length] = new Option(alphabet[i - 1].toUpperCase(), alphabet[i - 1].toUpperCase());
            }
            houseCodes.selectedIndex = 0;
            houseCodes.onchange = function () { saveHouseCode(); };
            z.appendChild(houseCodes);


            var numbers = new Array(16); //create a 16 element array

            var unitCodes = document.createElement("select");
            unitCodes.className = "button";
            var zeroOption2 = new Option("UnitCode", "0");
            unitCodes.options[unitCodes.options.length] = zeroOption2;
            for (var i = 1; i <= numbers.length; i++)
            {
                unitCodes.options[unitCodes.options.length] = new Option(i.toString(), i.toString());
            }
            unitCodes.selectedIndex = 0;
            unitCodes.onchange = function () { saveUnitCode() };
            z.appendChild(unitCodes);

            function saveHouseCode()
            {

                Homey.emit('saveHouseCode', { "houseCode": houseCodes[houseCodes.selectedIndex].value });
            }

            function saveUnitCode()
            {
                Homey.emit('saveUnitCode', { "unitCode": unitCodes[unitCodes.selectedIndex].value });

            }

                var sameX10Address = document.createElement('div');
                sameX10Address.id = 'sameX10Address';              
                z.appendChild(sameX10Address);

                var youCanContinue = document.createElement('div');
                youCanContinue.id = 'youCanContinue';              
                z.appendChild(youCanContinue);

            Homey.on('same', function ()
            {
                //alert('same address detected')
                 sameX10Address.innerHTML = 'Already used houseCode and unitCode detected';
                 youCanContinue.innerHTML = 'You can continue to pair if you wish';
               
           })

            Homey.on('notSame', function ()
            {
             
                sameX10Address.innerHTML = 'Not used houseCode and unitCode detected';
                youCanContinue.innerHTML = 'You can continue to pair if you wish';              

           })








            var nextButton = document.createElement('div');
            nextButton.id = 'next';
            nextButton.className = 'button';
            nextButton.innerHTML = 'NEXT >';


            nextButton.style.position = 'absolute';
            nextButton.style.bottom = 0;
            nextButton.style.right = 0;
            nextButton.onclick = next;
            z.appendChild(nextButton);

            function next()
            {
               // alert('nextbutton pressed')


                var virtualDeviceClass = $('.deviceclasses-list input[name="deviceClass-dummy"]:checked');

                Homey.emit('done', function (err, device)
                {
                    if (virtualDeviceClass.length > 0)
                    {
                        device.virtualClass = $(virtualDeviceClass).val();
                        device.virtualCapabilities = $(virtualDeviceClass).data('capabilities').split(',');
                    }

                    Homey.addDevice(device, function ()
                    {
                        Homey.done();
                    });
                });


                document.body.innerHTML = '<i class="loading fa fa-cog fa-spin"></i>'


            }


        }

makehtml();

`   // end tick scriptfunction

        this.html = `
<!DOCTYPE html>
<div id='instruction'class="button" >Choose the housecode and unitcode of X10 device </div>
<div id='text' ></div>
`  // end tick html

        

        this.log('app x10devicemap ', Homey.app.X10DeviceMap)
        this.log('app virtualdeviceclassmap ', Homey.app.virtualDeviceClassMap)
        
        this.sendParametersTypes = Array.from(Homey.app.X10DeviceMap.values())
        this.sendParametersVirtualDeviceClasses = Array.from(Homey.app.virtualDeviceClassMap.values())

        this.log('this.sendParametersTypes', this.sendParametersTypes)
        this.log('this.sendParametersTypes', this.sendParametersVirtualDeviceClasses)
        this.homeyDevices = []// Homey.app.homeyDevices
        this.devicesData = [];  // from drivers
        this.heardList = [];    // to be paired is list of devoicesdata. otherr device properties doesn matter
        this.devices = this.getDevices()  // array
        //this.log('devices from getdevices  ', util.inspect(this.devices,true,null))
        this.log(' driver id  ', this.id)
        

        for (let device of this.devices) {
            this.devicesData.push(device.getData())
        }

        this.log(`devices data ${util.inspect(this.devicesData)}`)


        
    } // on end init


       onPair(socket) {

           let houseCode = ''
           let unitCode = ''
           let type = ''   // type of device eg visonicdoorsensor or ms13e
           let virtualDeviceClass = ''
           let protocol = ''
           let driver = this.id
           let capabilities = []

           this.log('x10 driver oninit this homeydevices', this.homeyDevices)

          


           this.send = { 'sendhtml': this.html, 'sendscript': this.scriptfunction, 'sendParameters' : this.sendParameters}

          // socket.emit('pairHtml', this.send);

           // fir testing only
           socket.emit('sendParametersTypes', { 'sendParametersTypes': this.sendParametersTypes });
           socket.emit('sendParametersVirtualDeviceClasses', { 'sendParametersVirtualDeviceClasses': this.sendParametersVirtualDeviceClasses });

           socket.on("saveUnitCode", data => {

               this.log('x10 pairing device unitcode    ', data.unitCode);
               unitCode = data.unitCode;
               if (helpFunctions.containsX10Address3(this.devicesData, houseCode, unitCode)) {

                   socket.emit('same')
               }
               else { socket.emit('notSame') }

           });

           socket.on('saveHouseCode', data => {

               this.log("x10 pairing device housecode    ", data.houseCode);
               houseCode = data.houseCode;

               if (helpFunctions.containsX10Address3(this.devicesData, houseCode, unitCode)) {

                   socket.emit('same')
               }
               else { socket.emit('notSame') }
               
           });

          
             socket.on('saveDeviceType', data => {

               this.log("x10 pairing device type  data  ", data);

               type = data.deviceType 

               this.log("x10 pairing device type    ", type );
               
                            

           });

           socket.on('saveVirtualDeviceClass', data => {

               this.log("x10 pairing device type  data  ", data);

               virtualDeviceClass = data.virtualDeviceClass

               this.log("x10 pairing virtualClass    ", virtualDeviceClass);



           });


           socket.on("done", (data, callback) => {

              

               if (Homey.app.rfxcomDeviceTypes[type] != null) {
                   // Check the checksum before we start decoding
                   capabilities = Homey.app.rfxcomDeviceTypes[type].capabilities
                   protocol = Homey.app.rfxcomDeviceTypes[type].data.protocol

                   this.log(' capsabilities ', util.inspect(capabilities))
                   this.log(' protocol ', util.inspect(protocol))


               }



               let devicedata = {
                   id: protocol + type + houseCode + unitCode,             // old id was rfxcom ms13 housecode unitcode same as name 
                   houseCode: houseCode,
                   unitCode: unitCode,
                   protocol: protocol ,
                   type: type
                  
               }

               let filledDevice = new Fdevice(devicedata, driver, capabilities, virtualDeviceClass)
                                

                       
              

              
             
              // callback(null, filledDevice);
               
           
              this.log(" x10 pair done this filledDevice ", util.inspect(filledDevice));
              this.log('drivr 174 add filledDevice.data.id ', filledDevice.data.id)


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

           })

        
       }


}

module.exports = X10Driver;