# Pulurobot M Operation Documentation
## Operational Guide
### Accessing RaspberryPi File Partition
The 2 primary ways of accessing the file system are to SSH to the robot itself, or to remove the SD card from the RPi and access it directly.
##### SSH
In order to SSH to the robot you must be within the same network as the robot, if you are unsure of the robots IP, you will need to manually connect to the robot and check its IP with a network scanner or from the host router.

If the robot is online you may simply do so through the vpn (you may need to ssh to the vpn first).
`ssh hrst@{network IP}`
`password:` Enter the user account password.

You can also directly network to the robot via the ethernet port located on the RPi or the socket underneath the chassi. Plug in the ehternet cable and repeat the above procedure.

### Backing up RPi Image
It is important to backup the SD card before you implement any changes to the Pi as it can be irreversable or you may encounter unforseen issues. You will also need a microSD card reader.

Before connecting the microSD card to your SD card reader, run the following command in terminal to identify the currently connected devices.
`df h`
Now plug in your SD card and re-run the above command. Your SD Card will be the new device listed, it should be something similar to '/dev/sda#'

In the terminal window run the following command using the 'FileSystem' name, make sure you do not include the number at the end of the name.
`sudo dd if=/dev/{sdb - your drive's name} of=~/SDBackup.img`
The DD command does not show any progress indications so you will need to wait until the system has completed the copy, this may take several minutes.

### Network Configuration
##### General Settings
To connect to a network automatically on bootup you will need acceess to the RPi File partition (instructions on how to d this can be found !here!). Once you have gained access follow these steps:

1. The network interface settingsa are located in the file 'etc/network/interfaces.txt'. To view these settings enter:
    `cat etc/network/interfaces.txt `
    - Network Configuration DHCP/Static change the lest part accordingly
		`iface eth0 inet dhcp/static`
	

2.  Before changing any settings create a backup of the current network interfaces
	`sudo cp /etc/network/interfaces /etc/network/interfaces.backup`
 
##### Defining a new connection
1.  Open the text file 'etc/network/interfaces.txt' to edit
    `sudo nano /etc/network/interfaces`
2.  Enter the SSID and passcode of the desired network next to 'wpa-ssid' and 'wpa-psk' respectively.
    ```auto wlan0  
    iface wlan0 inet dhcp  
    wpa-ssid	"ssid"  
    wpa-psk 	"password"
# Changelog
#### Installed Packages
##### General Packages
- Gedit
##### GUI packages
- Xserver-xorg
- Xinit
- Raspberrypi-ui-mods
- Lxterminal
- LightDM
