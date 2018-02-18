"use strict";
var jan;


// returning functions in homey apps
(function (jan_1) {



    //#region test

    jan_1.na = a => a.map(v => { if (v === 1) { v = 0 } else if (v === 0) { v = 1 } return v });

    jan_1.testms13 = function () {
        console.log('this is the helpfunction test in ms13 ');
    }

    jan_1.testsignalx10 = function () {
        console.log('this is the helpfunction test in signalx10 ');
    }

    //#endregion

    //#region  homeysignaldecoding

    jan_1.bitStringToBitArray = function (str) {
        var result = [];
        for (var i = 0; i < str.length; i++)
            result.push(str.charAt(i) == '1' ? 1 : 0);
        return result;
    };

    jan_1.numberToBitArray = function (number, bit_count) {
        var result = [];
        for (var i = 0; i < bit_count; i++)
            result[i] = (number >> i) & 1;
        return result;
    };

    jan_1.bitArrayToNumber = function (bits) {
        return parseInt(bits.join(""), 2);
    };


    jan_1.bitArrayToString = function (bits) {
        return bits.join("");
    };

    jan_1.getKeyByValue = function (object, value) {
        return Object.keys(object).find(function (key) { if (object[key]['houseCode'] === value) { return key } });
    }

    // makes complement of array zero becomesone and vice verca
    jan_1.ComplementBitArray = function (ba) {
        var baComplement = [];

        for (var i = 0; i < ba.length; i++) {

            if (ba[i] == 0) {
                baComplement[i] = 1;
            } else if (ba[i] == 1) {
                baComplement[i] = 0
            };
        };
        return baComplement
    };

    //#endregion

    //#region arythmetic

    jan_1.isEven = function (n) {
        return n % 2 == 0;
    };

    //#endregion



    ////   //#region  bytedecoding

    //    // lsfb a nibble
    //    jan_1.lsbfNibble = function(nib) {
    //        //  util.log('nibble as par for f   ', nib);

    //        var lsfbnib = ""
    //        lsfbnib = nib.slice(3);
    //        // util.log('nibble0  ', lsfbnib);
    //        lsfbnib += nib.slice(2, 3);
    //        //  util.log('nibble1  ', lsfbnib);
    //        lsfbnib += nib.slice(1, 2);
    //        //  util.log('nibble2  ', lsfbnib);
    //        lsfbnib += nib.slice(0, 1);
    //        //  util.log('nibble3  ', lsfbnib);

    //        return lsfbnib;
    //    };

    //    //is the same as nib.slice().reverse()   slice is neccessary otherwisee the original nib is also reversed 

    ////#endregion



    //#region search or choose in obects

    //  Object.prototype.getKeyByValue = function (value) {
    //      for (var prop in this) {
    //          if (this.hasOwnProperty(prop)) {
    //              if (this[prop]['houseCode'] === value)
    //                  return prop;
    //          }
    //      }
    //  }


    jan_1.contains = function (a, obj) {
        // if for ecma6 
        //http://stackoverflow.com/questions/11743392/check-if-array-is-empty-or-exists
        if (typeof a != "undefined" && a != null && a.length > 0) {
            for (var i = 0; i < a.length; i++) {
                if (a[i].data.id == obj.data.id) {
                    return true;
                };
            };
        };
        return false;
    };

    //  e = element
    // http://stackoverflow.com/questions/237104/how-do-i-check-if-an-array-includes-an-object-in-javascript
    jan_1.contains2 = (a, b)                       => a.some(e => e.data.id == b.data.id )  // includes(b)

    jan_1.homeyDevicesContainsHomeyDevice = (a, b) => a.some(e => e.data.id === b.data.id)

    jan_1.devicesdataContainsHomeydevice = (a, b) => a.some(e => e.id === b.data.id)


    // get device from array with only id returns result
    jan_1.getDeviceFromId = (a, b) => a.find(e.data.id === b)

    jan_1.getDeviceDatafromId = (a, b) => a.find(e.id === b)


    jan_1.GetDEviceDatafromHouseAndUnitCode = (a, b, c) =>
     a.find(e => (e.houseCode == b && e.unitCode == c || (e.houseCode == b && Number(e.unitCode) == Number(c) - 1 && e.type == 'MS13E')))
    
       


   jan_1.contains3 = (a, b) => a.filter(e => e.data.id === b.data.id).length > 0



   // check if capability exists in string
  jan_1.containsCapability = (a, b) => a.some(e => e === b)


    // to check homeydevices a with homeydevice b returns true if exists in a
  jan_1.containsX10Address = (a, b) => a.some(e =>( e.data.houseCode === b.data.houseCode && e.data.unitCode === b.data.unitCode))

// to check homeydevices a with housecode b en unitcode c returns true if exists in a
  jan_1.containsX10Address2 = (a, b, c) => a.some(e => (e.data.houseCode === b && e.data.unitCode === c))
    // 5to check devices data with this house and unitcode
  jan_1.containsX10Address3 = (a, b, c) => a.some(e => (e.houseCode === b && e.unitCode === c))

  jan_1.containsChannel = (a, b) => a.some(e => (e.houseCode === b && e.unitCode === b))
    // fill devicecapabilitie with capabilities
  jan_1.fillpropertywitharrayofpropertties = a => a.map(c => ({ [c]: false }))

  jan_1.fillcap = arr => {

      let obj = {}

      arr.forEach(a => {
          return obj[a] = false
      }
      )

      return obj


  }



//#endregion

 //#region drivercompute functions

   // compute device out of parameters
   jan_1.tobepaireddevice = function(app, driver, capabilities) 
   {
       let pd = {}
       pd.data = {}
       if (app = "X10")
       {
           pd.data.id = app + driver + this.houseCode + this.unitCode
           pd.data.houseCode = this.houseCode
           pd.data.unitCode = this.unitCode
           pd.name = pd.data.id
           pd.capabilities = capabilities

       }
       this.lib.log("tobepaireddevice  ", pd);
       return pd
   }

//#endregion
 
})(jan = exports.jan || (exports.jan = {}));

