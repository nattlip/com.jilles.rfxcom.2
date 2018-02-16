# Rfxcom

Read and writes to Rfxcom devices

12-11-2017 complete rewrite to sdk2
           left app settings these are not evolved like the devices   , made devices of rfxcom transceivers, receivers and transmitters

22-12-2017 first admission to github beta version rfxtrx receiving put off 
           x10 works on lan sending and receiving
		   TEMPHUM works
		   app still in design fase

30-12-2017 combined drivers lan rfxcom devices and rfxtrx devices in driver rfxcom
           visonic sensor devices  door and movement  and contact are available  and report their status
		   x10 ms13e on/off and dim works on lan and rfxtrx sending on/off commands possible rfxtrx and lan , dim  and bright also on lan andrfxtrx
		   each RfxCom device can be stopped receiving an sending data via settings

16-02-2018  all visonic devices security are placed under the slave driver ,
            for first inclusion of type of device in the slave driver which should include all devices in the future as class extended by master driver
			added last read time sensors in settings device 
			made THB sensor work in oregon driver

            added Eldat Rx09 Easywave usb stick which receives Easywave Rf on a pi 3 as virtual rfxcom device
			

			to make the pi usbserial driver work with the Aldat Rx09 usbstick see

			https://raspberrypi.stackexchange.com/questions/78908/eldat-easywave-usbserial-device-not-detected/79020#79020

			to adapt the pi 3 for serial to net communication with Athom Homey 

			https://github.com/nattlip/pi.node.serial2net

			added Faak rollershutter Easywave device working with the Altron Rx09