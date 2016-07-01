# Payload Cli

## User Guide

### Using the command line program
1. Ensure a telemetry radio is plugged into your respected PC, and make note of its device path (OSX) or COM port number (Windows).
2. If you have not already, [download and install](https://nodejs.org/en/download/) Nodejs.
3. In your terminal, change to the `repl` directory, and invoke `node pewpew.js <serialdevpath> --repl`. `<serialdevpath>` is the devive path or COM port at which your telemetry radio is located.

If everything works, you should see a message similar to this:
`pew> Connected to serial device.`

You may need to reinstall the node modules depending on your PC and operating system. If you are having node errors that are crashing the program, *ensure* that you are in the root of the `repl` directory, and run `rm -rf node_modules/` to remove the modules directory. Then, run `npm install` to reinstall the modules.

**NOTE**: Currently, only versions of nodejs *prior* to the io.js merge are supported. This is due to the politics of open source software and the merge issues that originate from it. `Nodejs v4+` **will not work**. If you are using OSX, you can rollback to the supported version by running `brew switch node 0.12.7` in the command line.

Commands:

	status: Shows if the UAV is currently connected or not. If it is not, you must restart the program to reconnect to the drone. (The restart is to resolve any serial-device related issues, keep the ports from lockign up).

	exec: Sends a direct command to the PewPew pod. (Note: Update this readme at some point with these commands!)

	script: Invoke a JSON script that will run a set of commands at sequence, separate by milliseconds.

	quit/exit: Shut down the repl.

You can also execute scripts without runnning the command line by starting the program as `node pewpew.js <serialdevpath> <scriptpath>`. Where `<scriptpath>` is the **fully qualified** file path.

Script syntax:

	[
		{
			cmd: <String>,
			time: <Number in Milliseconds>
		},
		{ ... }
	]

Please ensure your script ends with `.json` file extension, as it is in JSON format. The `cmd` string is the raw command to send, and the `time` number is an integer in milliseconds to delay until the next command is invoked. **Please note that the firmware needs at least 10ms of latency between each command.**

### Payload_ctrl and Middleware

QuaRK's Firmware has been modified to include the data marshalling of pewpew. First, there is a new MAVLink message, `SEND_PAYLOAD_CMD` which is broadcasted by pewpew.js to QuaRK. The first two bytes contain the MAV ID and Component ID respectively. *Note* that the firmware is not using these right now, but they were added for future use (such as multiple UAVs). The last **64** bytes contains the raw command string. For example, `2c62w` would be 5 characters, and the next 15 are expected to be 0. It is received by the MAVLink module, which parses it and publishes a new uORB topic called `PAYLOAD_CMD`.

#### payload_ctrl
payload_ctrl is the name of the task in the firmware that handles sending data to the pewpew pod. The task listens for an updated `PAYLOAD_CMD` topic, and if updated, writes the serial data to the pewpew pod. If needed for debugging, you can view the status of the task by going into the NuttX command line.

	payload_ctrl start: Starts the task. (Already started by default on successful init).

	payload_ctrl stop: Shuts down the task.

	payload_ctrl status: Shows whether the task is currently running, how many write errors it has and how many reads it has made (will always be 0 right now).

payload_ctrl is run once every 10ms.

### Pewpew Protocol
#### Laser Scanner
To enter laser command mode start with "l", channel #, "c", command value (from 0-255), "w", end with ";"

Example: `l2c;l36w;` sets laser channel 2 (shape) to horizontal line (val: 36).

DMX channels: `#c`. All values range. `0-255`.

1. Laser control mode (default: 210)

		0-63: Stop
		64-127: Respond to Audio (hardware not enabled)
		128-191: Auto cycle through known shapes
		192-255: Drone controled
2. Set Shape: Known shapes

		2: small circle
 		4: large circle
 		40: Vertical line
 		36: Horizontal line
 		100: large square
 		92: octagon
 		94: pentagon
 		96: triangle
 		70: spiral
3. Color: Sets Overall color of the shape.

	Current version only has blue and controlled by green pin.

		0-1: White
		10-19: Green
4. X Position (horizontal): greater values increase speed

		1-127: Manual position adjustment
		128-160: Scan to left
		161-192: Scan to right
		193-224: Scan left to right
		225-255: Jump around
5. Y position (vertical): greater values increase speed

		1-127: Manual position adjustment
		128-160: Scan down
		161-192: Scan up
		193-224: Scan up and down
		225-240: Jump around
		241-255: Move in square
6. X Size (horizontal):

		2-75: Size from largest to smallest
		76-150: Inverted size from smallest to largest
		151-255: Automatic sizing
7. Y Size (vertical):

		2-75: Size from largest to smallest
		76-150: Inverted size from smallest to largest
		151-255: Automatic sizing
8. Rotation: greater values increase speed

		0-180: angle; from 0-360 degrees.
		181-224: Automatic CCW Rotation;  
		224-254: Automatic CW Rotation;
9. Overall scale

		0-10: Normal
		11-115: Size from smallest to largest
		116-170: Auto increase size, greater values increase speed
		171-210: Auto decrease size, greater values increase speed
		211-255: Automatic increase and decrease, greater value increases speed
10. Sine wave (?)

		0-127: Horizontal Fluctuation level
		128-255: Vertical Fluctuation level
11. Display mode

		0-63: Normal
		64-127: Shining point display
		128-191: Section line display
		192-255: Point display
12. Drawing speed

		0-64: Drawing completeness from 0-100%
		65-127: Draw in, greater values increase speed
		128-191: Draw out, greater values increase speed
		192-255: Draw in then out, greater values increase speed
13. Dual pattern mode

		0-255: Select two different motion patterns
14. Second pattern: Dual pattern mode (See channel 2)

15. Second pattern color choice (See channel 3)

#### Neopixels
Syntax:
	`n<number>[op]<args>`

- **n** Neopixel select
- **<number>** Quadrent select

	`0: Face`

	`1: Ring 1`

	`2: Ring 2`

	`3: Ring 3`

	`4: Ring 4`

	`5: All`

	`6: Right Half`

	`7: Left Half`

	`8: Diagonal Right`

	`9: Diagonal Left`

	`10: Everything but the face`

	`11: Back`

	`12: Front`
- **[op]** Operation to perform on section

	- **e** select effect

		`0: None`

		`1: Comet` 	   

		`2: Larson`

		`3: Chase`

		`4: Pulse`

		`5: Static` 	

		`6: Fade`

		`7: Fill`

		`8: Glow`

		`9: Rainbow `

		`10: Strobe `   	    	    	     

		`11: Sine wave `

		`12: Random `

		`13: Talking`

	- **c** color select

		`<hex> - 6 value RGB hex value. Must be 6 chars.`

		Example: `n2cff00ff;`  - Set color of ring 2 to purple.

	- **a** set area of effect (AoE)

		`<integer> - number of neopixels for area effect. Only applies to certain effects.`

		Example: `n0e2;n0cff0000;n0a1;` - Create a cylon style larson effect on the face.

	- **d** set animation rate in milliseconds

		`<integer> - rate in milliseconds to update`

		Example: `n10e2;n6cff0000;n7c0000ff;n6d1;n7d2;` - Create a police siren style effect.

	- **f** fill in a solid color

		`<hex> -  6 value RGB hex value. Must be 6 chars.`

		Example: `n5f333333` - Set drone color to a metallic gray.

	- **l** turn loop on or off. Only applies to certain effects.

		`<bool> 0 is false, 1 is true`

	- **i** invert the direction of the effect. Only applies to certain effects.

		`<bool> 0 is false, 1 is true`

#### Control Values

	c2; turn off neopixels.

	c3; turn on neopixels with default launch effects.

	c4; turn off laser (galvos will still run)

	c5; turn on laser  

#### Bottom Leds

	p<number>[color]
	<number>: 1-4, the led to select
	<color>: Hex color value. Must be 6 chars.

Example: `p2ff00ff;` - set LED 2 to purple.

## Current Issues & Todos

- Serial sometimes fails to parse command. This appears to be an issue with the `FastLED` library being used for the effects. Decreasing the draw rate of FastLED improves serial parsing, but also limits the update rate of FastLED.

- Certain effects in effect library have issues, and/or are largely untested.

- Improve timing/update system in effect library. Currently, the delay ticker actually *delays* the entire update, creating unneeded latency, where it should instead be used as a delta value for updating the animation function, ensuring there is no latency on the update.

- Arduino being used as controller for pewpew is at memory capacity.

- Add checksum support for serial protocol (CRC-16, most likely)

- Implement better gui for droneshow.

- Increase maximum command size? Currently 64. Requires update from Arduino.
