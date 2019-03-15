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
			

			to make the pi usbserial driver work with the Eldat Rx09 usbstick see

			https://raspberrypi.stackexchange.com/questions/78908/eldat-easywave-usbserial-device-not-detected/79020#79020

			to adapt the pi 3 for serial to net communication with Athom Homey 

			https://github.com/nattlip/pi.node.serial2net

			added Faak rollershutter Easywave device working with the Eldat Rx09

27-02-2018  deleted temphum driver, incorperated it in overall oregon driver
            added supprt for oregon temp , rain  and uv devices, so functionality is same as orgeon app
			added flow trigger for received X10 on off commands


23-08-2018  added new forum link

27-01-2019  made app Homey firmware V2 compliant, a lot changed in the pairing code V2 and icons still dont behave on android

28-01-2019  fixed a bug in socketclient

3-02-2019  fixed that not more then one usb device could be reached on a Rapberry pi, now multiple connections are possible with pi,
			or an ip in general (usefull in portforwarding)

15-03-2019 fixed two bugs which could led to crashes, receiving a somfy signal and adding remotes for somfys, somfy is not implemented in app ,
		   but rfxtrx receives the commands.


## Donate
If you like the app, consider buying me a Homey!  
[![Paypal donate][pp-donate-image]][pp-donate-link]

[pp-donate-link]: https://www.paypal.me/nattelip
[pp-donate-image]: https://www.paypalobjects.com/webstatic/en_US/i/btn/png/btn_donate_92x26.png