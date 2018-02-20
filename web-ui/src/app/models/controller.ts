import { Util, Angle, Vector2, DataBuffer } from "./util";
import { RobotRoute, Lidar, Robot }		from "./robotmap";

// ======================================================= Constants definitions
// You won't see this oftenly as it's a js trick no real used
// These names aren't used anywhere, it's just like a recap' of what can be
// found in other methods, they do not match the TCP cheat tho
export enum CommandCode {
	UPDATE_VIEW = 1,
	ROUTE = 2,
	CHARGER = 3,
	MODE_CHANGE = 4,
	MANUAL_COMMAND = 5,
	RESTART = 6,
	DEST = 7,
	DEL_MAPS = 8
}

export enum ReceptionCode {
	CURRENT_POSITION = 130,
	LIDAR = 131,
	CHARGE_STATE = 134,
	ROUTE = 135,
	MAP_UPDATE = 200
}

export enum Modes {
	USER_CONTROL = 0,
	USER_CONTROL_MAPPING = 1,
	AUTOMAP_COMPSKIP = 2,
	AUTOMAP_COMPSTART = 3,
	DAIJU = 4,
	DISABLE_MOTOR_MAPPING = 5,
	DISABLE_MOTORS_NO_MAPPING = 6,
	SET_CHARGER = 7
}

export enum ManualCommands {
	FORWARD = 10,
	BACKWARD = 11,
	TURN_LEFT = 12,
	TURN_RIGHT = 13
}

export class ControllerHistoryLine {
	date: Date;
	command: number;
	payload: DataBuffer;
	constructor(public sent: boolean, data: DataBuffer) {
		let c = data.array.shift()
		this.command = c.value
		data.length -= c.size
		this.date = new Date()
		this.payload = data
	}
}
export class ControllerHistory {
	history: Array<ControllerHistoryLine> = [];
	maxHistory: number = 50;
	constructor() {}
	pushInHistory(sent: boolean, data: DataBuffer) {
		let line = new ControllerHistoryLine(sent, data)
		this.history.push(line)
		while(this.history.length > this.maxHistory)	this.history.shift()
	}
}

// ==========================================)================= Robot controller

/**
* Wraps the _socket connection and the interactions with a robot
*/
export class RobotController {

	private _history: ControllerHistory =	new ControllerHistory();
	private _socket: WebSocket 					= null;
	private _url: string								= Util.getAppropriateWsUrl(true) || "";

	public robot: Robot

  constructor() {
		// this._historyTest()
	}

	private _historyTest() {
		let db = new DataBuffer()
		db.append("Uint8", CommandCode.MANUAL_COMMAND)
			.append("Uint8", Math.round(Math.random()*8))
		this._history.pushInHistory(true, db)

		db = new DataBuffer()
		db.append("Uint8", CommandCode.MANUAL_COMMAND)
			.append("Uint8", Math.round(Math.random()*8))
		this._history.pushInHistory(true, db)

		db = new DataBuffer()
		db.append("Uint8", ReceptionCode.CURRENT_POSITION)
			.append("Int8", 8)
			.append("Int16", 16)
			.append("Int32", 32)
			.append("Int64", 64)
		this._history.pushInHistory(false, db)

		db = new DataBuffer()
		db.append("Uint8", CommandCode.MANUAL_COMMAND)
			.append("Uint8", Math.round(Math.random()*8))
		this._history.pushInHistory(true, db)

		db = new DataBuffer()
		db.append("Uint8", CommandCode.MANUAL_COMMAND)
			.append("Uint8", Math.round(Math.random()*8))
		this._history.pushInHistory(true, db)
	}

	// Callbacks on sockets
	onOpen() {}
	onError(error: Event) {	}
	onUrlChange(url: string) {}

	set url(url) {
		this._url = url
		this.onUrlChange(url)
	}

	get url() {	return this._url || "..."	}
  get history() {
		return this._history
	}

	/**
	* Call it after you have set all the handlers and the proper url, it will
	* open the _socket connection
	*/
  startConnection() {
		this.endConnection("Restart")
    this._socket = Util.createWebSocket(this._url, "rn1-protocol")
    this._socket.onopen = ()=> {
      this.onOpen()
    }
    this._socket.onmessage = (msg) => {
      this._onMessage(msg)
    }
    this._socket.onerror = (error) => {
      this.onError(error)
    }
    this._socket.onclose = (event) => {
      this.onSocketClose(event)
    }
  }

	/**
	* Close the _socket when you need it
	*/
  endConnection(msg = "Closed on purpose by the controller") {
    if(this.isClosing() || this.isClosed())  return
    this._socket.close(1000, msg)
  }

  // Ready states

	isConnecting(): boolean {
		return this._socket && this._socket.readyState == WebSocket.CONNECTING
	}

	isOpen(): boolean {
		return this._socket && this._socket.readyState == WebSocket.OPEN
	}

	isClosing(): boolean {
		return this._socket && this._socket.readyState == WebSocket.CLOSING
	}

	isClosed(): boolean {
		return !this._socket || this._socket.readyState == WebSocket.CLOSED
	}

  private _send(databuffer) {
    if (this.isClosed()) {
      console.warn("This socket is CLOSED")
    } else if (this.isClosing()) {
      console.warn("This socket is CLOSING")
    } else if(this.isConnecting()) {
			console.warn("Wait a little more")
		}else {
      this._socket.send(databuffer.toBlob())
			this._history.pushInHistory(true, databuffer)
    }
  }

  // COMMANDS

  /**
  * Updates the view in the area from start (upper left) to end (lower right)
  * start upper left corner
  * end lower right corner
  **/
  updateView(start, end, callback = null) {
    let db = new DataBuffer()

    db.append("Uint8", CommandCode.UPDATE_VIEW)
      .append("Int32", start.x)
      .append("Int32", start.y)
      .append("Int32", end.x)
      .append("Int32", end.y)

    this._send(db)
    if(callback)  callback()
  }

  /**
  * Try to make a route to the target
  * target the target the robot will aim for
  */
  doRoute(target: Vector2, callback = null) {
    let db = new DataBuffer()

    db.append("Uint8", CommandCode.ROUTE)
      .append("Int32", target.x)
      .append("Int32", target.y)
      .append("Uint8", 0)

    this._send(db)
    if(callback)  callback()
  }

  /**
  * Try to do smthg specific with a target.
  * If command is forward (or forward), the robot will go straight to the target
  * straightforward (ie backward) to the target ignoring obstacles
  * if it's ROTATE, it will rotate toward the target
  * target Vector2 the target the robot will aim for
  * command number FORWARD(0) | BACKWARD(1) | ROTATE(8)
  */
  doDest(target, command, callback = null) {
    let db = new DataBuffer()

    db.append("Uint8", CommandCode.DEST)
      .append("Int32", target.x)
      .append("Int32", target.y)
      .append("Uint8", command)

    this._send(db)
    if(callback)  callback()
  }

  /**
  * Send a message affecting the software level
  * type number RESTART(1) | QUIT(5) | UPDATE(6) | REFLASH(10) | REBOOT(135) | SHUTDOWN(136)
  */
  softwareMessages(type, callback = null) {
    let db = new DataBuffer()

  	db.append("Uint8", CommandCode.RESTART)
  		.append("Uint8", type)

    this._send(db)
    if(callback)  callback()
  }

  /**
  * Change the mode of the robot
  * mode number One of the values of MODES
  */
  changeMode(mode, callback = null) {
    let db = new DataBuffer()

    db.append("Uint8", CommandCode.MODE_CHANGE)
      .append("Uint8", mode);

    this._send(db)
    if(callback)  callback()
  }

  /**
  * Send a direct instruction for the robot concerning its movement
  * command number One of the values of MANUAL_COMMANDS
  */
  manualCommand(command, callback = null) {
    let db = new DataBuffer()

    db.append("Uint8", CommandCode.MANUAL_COMMAND)
      .append("Uint8", command)

    this._send(db)
    if(callback)  callback()
  }

  /**
  * Sends the robot to the charger
  */
  charger(callback = null) {
    let db = new DataBuffer()

    db.append("Uint8", CommandCode.CHARGER)

    this._send(db)
    if(callback)  callback()
  }

  /**
  * Delete all the maps contained in the robot
  */
  deleteMaps(callback = null) {
    let db = new DataBuffer()

    db.append("Uint8", CommandCode.DEL_MAPS)

    this._send(db)
    if(callback)  callback()
  }


  // RECEPTION

  private _onMessage(msg) {
    if(msg.data instanceof Blob) {
      let fileReader = new FileReader()

      fileReader.onload = () => {
        let arrayBuffer = fileReader.result
        let header = new Uint8Array(arrayBuffer.slice(0,3))
        let code = header[0]
        let payload_size = (header[1]<<8) + header[2]
        let payload = arrayBuffer.slice(3)

        switch(code) {
          case ReceptionCode.MAP_UPDATE:
            this._retrieveWorld(msg, arrayBuffer)
            break;
          case ReceptionCode.CURRENT_POSITION:
            this._retrievePosition(payload, arrayBuffer)
            break;
          case ReceptionCode.CHARGE_STATE:
            this._retrieveChargingState(payload, arrayBuffer)
            break;
          case ReceptionCode.ROUTE:
            this._retrieveRoute(payload, arrayBuffer)
            break;
          case ReceptionCode.LIDAR:
            this._retrieveLastLidar(payload, arrayBuffer)
            break;
          default:
            console.warn("It seems that your reception code is not handled yet. Code: " + code)
        }
      }
      fileReader.readAsArrayBuffer(msg.data)
    }
  }

	/**
  * On reception of the msg "Retrieve world", do something (it's a callback)
	* feel free to override it.
  * world The world retrieved
  */
  onWorldRetrieve(world: Map<any, any>){
		// console.log("Got the world")
	}

	/**
	* On reception of the msg "Position robot", do something (it's a callback)
	* feel free to override it.
	* position The position of the thing
	* angle The angle in radians
	*/
  onPositionRetrieve(position: Vector2, angle: number) {
		// console.log("Got the position")
	}

	/**
	* On reception of the msg "Charge robot", do something (it's a callback)
	* feel free to override it.
	* position The position of the thing
	*/
  onChargingStateRetrieve( flags: number, volt: number, volt_in: number, percentage: number){
		// console.log("Got the charge")
	}

	/**
	* On reception of the msg "Route robot", do something (it's a callback)
	* feel free to override it
	* route The route followed by the robot
	*/
  onRouteRetrieve(route: RobotRoute){
		// console.log("Got the route")
	}

	/**
	* On reception of the msg "Last lidar robot", do something (it's a callback)
	* lidar The last lidar done by the robot
	* angle The angle of robot in radians
	*/
  onLastLidarRetrieve(lidar: Lidar, angle: number){
		// console.log("Got the last lidar")
	}

  private _retrieveWorld(msg, arrayBuffer) {
    let image = new Image()
    let world = new Map()
		let afterload = () => {
			world.set([img_x_mm, img_y_mm], image);
			this.onWorldRetrieve(world);
			console.log(world)
		}

		image.onload = (e) => {afterload()}

    image.src = URL.createObjectURL(msg.data.slice(10, msg.data.size, "image/png"))
    let img_x_mm = new DataView(arrayBuffer).getInt32(1, false);
    let img_y_mm = new DataView(arrayBuffer).getInt32(5, false);
    let status = new DataView(arrayBuffer).getUint8(9);
    image.width = 256;
    image.height = 256;

		afterload()

		let db = DataBuffer.parser( arrayBuffer, [{type:"Uint8"},{type:"Int32"},{type:"Int32"},{type:"Uint8"}])
		this._history.pushInHistory(false, db)
  }

  /**
  * Retrieve the position of robot from the payload
  * callback func What to do with the position as a Vector2 and the angle in radians
  */
  private _retrievePosition(payload, arrayBuffer) {
		let pos = new Vector2(
			new DataView(payload).getInt32(2, false),
			new DataView(payload).getInt32(6, false)
		)
		let angle = Angle.numericToRad(new DataView(payload).getInt16(0, false),16)
    this.onPositionRetrieve(
      pos,
      angle
    );
		if(this.robot) {
			this.robot.pos = pos
			this.robot.angle = angle
		}
		let db = DataBuffer.parser( arrayBuffer, [{type:"Uint8"}, {type:"Uint8"}, {type:"Uint8"}, {type:"Int16"},{type:"Int32"},{type:"Int32"}])
		this._history.pushInHistory(false, db)
  }

  /**
  * Retrieve informations about the charge
  * callback func Params: flags, volt, volt in and percentage of battery
  */
  private _retrieveChargingState(payload, arrayBuffer) {
    let flags = new DataView(payload).getUint8(0)
    let volt  = new DataView(payload).getUint16(1, false)
    let percentage = new DataView(payload).getUint8(3)
    let volt_in = new DataView(payload).getUint16(4, false)

		if(this.robot) {
			this.robot.batteryState 	= flags
			this.robot.batteryPercent = percentage
			this.robot.voltIn					= Math.round(volt_in) / 1000
			this.robot.volt						= Math.round(volt) / 1000
		}

    this.onChargingStateRetrieve(
      flags,
      volt,
      volt_in,
      percentage
    )

		let db = DataBuffer.parser( arrayBuffer, [{type:"Uint8"}, {type:"Uint8"}, {type:"Uint8"}, {type:"Uint8"},{type:"Uint16"},{type:"Uint8"},{type:"Uint16"}])
		this._history.pushInHistory(false, db)
  }

  /**
  * Retrieve the route the robot calculated toward a target
  * callback func Params: route
  */
  private _retrieveRoute(payload, arrayBuffer) {
    // 9 filler length, -8 for the last octet which is the mode
    let route_len = (payload.length - 8) / 9;
    let route = new RobotRoute()

		let typeTab = [{type:"Uint8"}, {type:"Uint8"}, {type:"Uint8"}]

    if(route_len > 0) {
      route.changeStart(
          new DataView(payload).getInt32(0, false),
          new DataView(payload).getInt32(4, false)
        )
			typeTab.push({type:"Int32"})
			typeTab.push({type:"Int32"})

      for(let i = 0; i < route_len; i++) {
        let offset = 8
        let idx = i * 9
        route.addPoint(
          new DataView(payload).getInt32(idx + offset+1, false),
          new DataView(payload).getInt32(idx + offset+5, false),
          new DataView(payload).getUint8(idx + offset)
        )
				typeTab.push({type:"Int32"})
				typeTab.push({type:"Int32"})
				typeTab.push({type:"Int8"})
      }
    }

    this.onRouteRetrieve( route )
		let db = DataBuffer.parser( arrayBuffer, typeTab )
		this._history.pushInHistory(false, db)
  }

  /**
  * Retrieve the last lidar
  * callback func Params: lidar, robot_angle
  */
  private _retrieveLastLidar(payload, arrayBuffer) {
    let lidar_len = (payload.length - 10) / 2;

		let typeTab = [{type:"Uint8"}, {type:"Uint8"}, {type:"Uint8"}]
    // Not used ?
    let robot_angle = Angle.numericToDeg(new DataView(payload).getInt16(0, false), 16);
    let robot_x = (new DataView(payload).getInt32(2, false));
    let robot_y = (new DataView(payload).getInt32(6, false));

		typeTab.push({type:"Int16"})
		typeTab.push({type:"Int32"})
		typeTab.push({type:"Int32"})

    let last_lidar = new Lidar()

    let offset = 10
    for ( let i = 0; i < lidar_len; i++) {
      let idx = 2*i
      let x = new DataView(payload).getInt8(idx + offset);
      let y = new DataView(payload).getInt8(idx + offset + 1);
      last_lidar.addPoint(
          x * 160 + robot_x,
          y * 160 + robot_y
        )
			typeTab.push({type:"Int8"})
			typeTab.push({type:"Int8"})
    }

    this.onLastLidarRetrieve(
        last_lidar,
        robot_angle
      )
		let db = DataBuffer.parser( arrayBuffer, typeTab )
		this._history.pushInHistory(false, db)
  }

  // Default on close
  onSocketClose(event: CloseEvent) {
    let reason;

    if (event.code == 1000)	return

    if (event.code == 1001)
      reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
    else if (event.code == 1002)
      reason = "An endpoint is terminating the connection due to a protocol error";
    else if (event.code == 1003)
      reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
    else if (event.code == 1004)
      reason = "Reserved. The specific meaning might be defined in the future.";
    else if (event.code == 1005)
      reason = "No status code was actually present.";
    else if (event.code == 1006)
      reason = "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
    else if (event.code == 1007)
      reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
    else if (event.code == 1008)
      reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
    else if (event.code == 1009)
      reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
    else if (event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
      reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
    else if (event.code == 1011)
      reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
    else if (event.code == 1015)
      reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
    else
      reason = "Unknown reason";
    console.warn(event.target, reason)
  }
}
