// ======================================================= Constants definitions
// You won't see this oftenly as it's a js trick no real used
// These names aren't used anywhere, it's just like a recap' of what can be
// found in other methods, they do not match the TCP cheat tho
let COMMANDS_CODE = Object.freeze({
	UPDATE_VIEW: 1,
	ROUTE: 2,
	CHARGER: 3,
	MODE_CHANGE: 4,
	MANUAL_COMMAND: 5,
	RESTART: 6,
	DEST: 7,
	DEL_MAPS: 8
})

let RECEPTION_CODE = Object.freeze({
	CURRENT_POSITION: 130,
	CHARGING_STATE: 134,
	MAP_UPDATE: 200
})

let MODES = Object.freeze({
	USER_CONTROL: 0,
	USER_CONTROL_MAPPING: 1,
	AUTOMAP_COMPSKIP: 2,
	AUTOMAP_COMPSTART: 3,
	DAIJU: 4,
	DISABLE_MOTOR_MAPPING: 5,
	DISABLE_MOTORS_NO_MAPPING: 6,
	SET_CHARGER: 7
})

let MANUAL_COMMANDS = Object.freeze({
	FORWARD: 10,
	BACKWARD: 11,
	TURN_LEFT: 12,
	TURN_RIGHT: 13
})

let CHARGE_FLAGS = Object.freeze({
	CHARGING: 1,
	FULL: 2
})

let robotMap;

// Create the map after the document is created
$(function() {
	robotMap = new RobotMap("map")
	robotMap.startRender()
})

// /!\ NO VISUAL UPDATE IT'S A TRAP
function update_view() {
	let mm_start = robotMap.mm_start
	let mm_end = robotMap.mm_end

	let db = new DataBuffer()

	db.append("Uint8", 1)
		.append("Int32", mm_start.x)
		.append("Int32", mm_start.y)
		.append("Int32", mm_end.x)
		.append("Int32", mm_end.y)

	send(db.toBlob(), socket_di);
}

function do_route() {
	let db = new DataBuffer()

	db.append("Uint8", 2)
		.append("Int32", robotMap.click_pos_mm.x)
		.append("Int32", robotMap.click_pos_mm.y)
		.append("Uint8", 0)

	send(db.toBlob(), socket_di);
	robotMap.deactivate_click();
}

function do_dest(m) {
	let db = new DataBuffer()

	db.append("Uint8", 7)
		.append("Int32", robotMap.click_pos_mm.x)
		.append("Int32", robotMap.click_pos_mm.y)
		.append("Uint8", m)

	send(db.toBlob(), socket_di);
	robotMap.deactivate_click();
}

function restart_msg(m) {
	let db = new DataBuffer()
	db.append("Uint8", 6)
		.append("Uint8", m)
	send(db.toBlob(), socket_di);
}

function mode(m) {
	let db = new DataBuffer()
	db.append("Uint8", 4).append("Uint8", m);
	send(db.toBlob(), socket_di);
}

function manu(m) {
	let db = new DataBuffer()
	db.append("Uint8", 5)
		.append("Uint8", m)
	send(db.toBlob(), socket_di);
}

function charger() {
    let db = new DataBuffer()
    db.append("Uint8", 3)
    send(db.toBlob(), socket_di);
}

function do_direct_fwd() {  do_dest(0); }
function do_direct_back() { do_dest(1); }
function do_rotate() {      do_dest(8); }

function rn1host_restart() {    restart_msg(1); }
function rn1host_quit() {       restart_msg(5); }
function rn1host_update() {     restart_msg(6); }
function rn1host_reflash() {    restart_msg(10);}
function rn1host_reboot_raspi() {restart_msg(135);}
function rn1host_shdn_raspi() { restart_msg(136); }

// Wrappers for the html calls of manual commands
function manu_fwd()   {   manu(MANUAL_COMMANDS.FORWARD);    }
function manu_back()  {   manu(MANUAL_COMMANDS.BACKWARD);   }
function manu_left()  {   manu(MANUAL_COMMANDS.TURN_LEFT);  }
function manu_right() {   manu(MANUAL_COMMANDS.TURN_RIGHT); }

// Wrappers for the html calls of modes
function mode0() {  mode(0);  }
function mode1() {  mode(1);  }
function mode2() {  mode(2);  }
function mode3() {  mode(3);  }
function mode4() {  mode(4);  }
function mode5() {  mode(5);  }
function mode6() {  mode(6);  }
function mode7() {  mode(7);  }

// On long drags, zooms and redraws you should also retrieve a new view from the
// robot. It was in the previous version but the clean up made disappear
// as the map is now just a visual for a view
// Next up, adding the possibility to rebind these functions

// ================================================================= Web sockets

function get_appropriate_ws_url(localhost = false) {
  let pcol;
	let u = document.URL;

	// What interest us right there is the "s" for security
	if (u.substring(0, 5) == "https") {
		pcol = "wss://";
		u = u.substr(8);
	} else {
		pcol = "ws://";
		if (u.substring(0, 4) == "http")
			u = u.substr(7);
	}

	if (localhost) return "ws://localhost:44444";
	return pcol + u.split('/')[0] + "/xxx";
}

let _url = get_appropriate_ws_url(true)
document.getElementById("ws_url").textContent = _url;

var socket_di = createWebSocket(_url, "rn1-protocol")
var world = new Map();

function do_del_maps() {
	let db = new DataBuffer()
	db.append("Uint8", 8);
	send(db.toBlob(), socket_di);

	robotMap.deactivate_click();
	world = new Map();
}

try {

	function send(blob, socket = socket_di) {
		if (socket.readyState == socket.CLOSED) {
			console.warn("This socket is CLOSED")
		} else if (socket.readyState == socket.CLOSING) {
			console.warn("This socket is CLOSING")
		} else {
			socket.send(blob)
		}
	}

	socket_di.onopen = function() {
		document.getElementById("wsdi_status")
			.innerHTML = "opened " + sanitize(socket_di.extensions);
		console.log("OPENED")
		document.getElementById("wsdi_status").textContent = "opened";
		$("#wsdi_card_status").removeClass("bg-flat-color-5 bg-flat-color-4 bg-flat-color-3 bg-flat-color-2 bg-flat-color-1");
		$("#wsdi_card_status").addClass("bg-flat-color-5");
	}

	socket_di.onmessage = (msg) => {
		// Check on the instance of the data
		if (msg.data instanceof Blob) {
			var fileReader = new FileReader();

			fileReader.onload = function() {
				let arrayBuffer = this.result;
				var view = new Uint8Array(arrayBuffer.slice(0, 3));

				//Retrieve the length of the payload (Bigendian)
				var pay_size = view[1] * 256 + view[2];

				switch (view[0]) {
					case RECEPTION_CODE.MAP_UPDATE:
						{
							var image = new Image();
							image.onload = function() {
								robotMap.changeTheWorld(world)
								robotMap.draw_world();
							}
							image.src = URL.createObjectURL(msg.data.slice(10, msg.data.size, "image/png"));
							var img_x_mm = (new DataView(arrayBuffer).getInt32(1, false));
							var img_y_mm = (new DataView(arrayBuffer).getInt32(5, false));
							var status = (new DataView(arrayBuffer).getUint8(9));
							image.width = 256;
							image.height = 256;
							world.set([img_x_mm, img_y_mm], image);
							break;

						}
					case RECEPTION_CODE.CURRENT_POSITION:
						{
							robotMap.setRobotPosition(
								(new DataView(arrayBuffer.slice(3, 5)).getInt16(0, false)) / 65536 * 2 * Math.PI(new DataView(arrayBuffer.slice(5, 9)).getInt32(0, false))
								(new DataView(arrayBuffer.slice(9, 13)).getInt32(0, false))
							);
							robotMap.draw_world();
						}
						break;
					case RECEPTION_CODE.CHARGING_STATE:
						{
							let flags = (new DataView(arrayBuffer).getUint8(3));

							let str = "";
							if (flags & CHARGE_FLAGS.CHARGING) str += "CHARGING ";
							if (flags & CHARGE_FLAGS.FULL) str += "FULL ";

							let volts = (new DataView(arrayBuffer).getUint16(4, false));
							let percentage = (new DataView(arrayBuffer).getUint8(6));

							document.getElementById("bat_status")
								.textContent = volts / 1000 + "V  " + percentage + "%  " + str;
						}
						break;
					case 135:
						{
							// 9 filler length, -8 for the last octet which is the mode
							route_len = (pay_size - 8) / 9;

							if (route_len == 0) {
								document.getElementById("status").textContent = "Sorry, no route found!";
								break;
							}
							document.getElementById("status").textContent = "Following route!";

							route_start = new Array(2);
							route_start[0] = (new DataView(arrayBuffer).getInt32(3, false));
							route_start[1] = (new DataView(arrayBuffer).getInt32(7, false));

							route = new Array(route_len);
							for (i = 0; i < route_len; i++) {
								route[i] = new Array(3);
								route[i][2] = (new DataView(arrayBuffer).getUint8(i * 9 + 11));
								route[i][0] = (new DataView(arrayBuffer).getInt32(i * 9 + 12, false));
								route[i][1] = (new DataView(arrayBuffer).getInt32(i * 9 + 16, false));
							}

							robotMap.draw_world();

						}
						break;

					case 131:
						{
							if (isDragging) break;

							last_lidar_len = (pay_size - 10) / 2;

							var lidar_robot_angle = (new DataView(arrayBuffer.slice(3, 5)).getInt16(0, false)) / 65536 * 360;
							var lidar_robot_x = (new DataView(arrayBuffer.slice(5, 9)).getInt32(0, false));
							var lidar_robot_y = (new DataView(arrayBuffer.slice(9, 13)).getInt32(0, false));

							last_lidar = new Array(last_lidar_len);

							for (i = 0; i < last_lidar_len; i++) {
								var x = (new DataView(arrayBuffer.slice(13 + 2 * i + 0, 13 + 2 * i + 1)).getInt8(0, false));
								var y = (new DataView(arrayBuffer.slice(13 + 2 * i + 1, 13 + 2 * i + 2)).getInt8(0, false));
								last_lidar[i] = new Array(2);
								last_lidar[i][0] = x * 160 + lidar_robot_x;
								last_lidar[i][1] = y * 160 + lidar_robot_y;
							}
						}
						break;

					default:
						{}

				}

			};
			fileReader.readAsArrayBuffer(msg.data);
		}
	}

	socket_di.onerror = function(e) {
		console.warn("Unable to connect");
		document.getElementById("wsdi_status").textContent = "closed (Error)";
		$("#wsdi_card_status").removeClass("bg-flat-color-5 bg-flat-color-4 bg-flat-color-3 bg-flat-color-2 bg-flat-color-1");
		$("#wsdi_card_status").addClass("bg-flat-color-4");
	}

	socket_di.onclose = function(event) {
		var reason;

		if (event.code == 1000)
			reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
		else if (event.code == 1001)
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
		console.warn(event.target.url, reason)

		document.getElementById("wsdi_status").textContent = "closed";
		$("#wsdi_card_status").removeClass("bg-flat-color-5 bg-flat-color-4 bg-flat-color-3 bg-flat-color-2 bg-flat-color-1");
		$("#wsdi_card_status").addClass("bg-flat-color-4");

	}
} catch (exception) {
	alert('<p>Error' + exception);
}
