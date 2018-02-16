"use strict";
const util = require('util');


class dating {

    constructor()
    {



       

        this.returnHumanDateString = (date) => {

            let day = date.getDate()
            let month = date.getMonth() + 1 // zero indexed 
            let year = date.getFullYear()
            let hour = date.getHours()
            let minute = date.getMinutes()
            let second = date.getSeconds()

            return `${day}-${month}-${year} ${hour}:${minute}:${second}`

        }


        // in msec
        this.returnDeltaTime = (deltadate) =>
        {
            
            let diff = Math.abs(Math.floor(deltadate)/1000);

            let days = Math.floor(diff / (24 * 60 * 60));
            let leftSec = diff - days * 24 * 60 * 60;

            let hrs = Math.floor(leftSec / (60 * 60));
                 leftSec = leftSec - hrs * 60 * 60;

            let min = Math.floor(leftSec / (60));
             leftSec = leftSec - min * 60;

            return ` d ${days} h ${hrs} m ${min} s ${leftSec}`
        }



      






       



    }
    


    



}

module.exports =  new dating()  // for using reference dating in other file
// module.exports =   dating    // for using extending then suoer is called as replacement for new
