
let robotMap;
let robotController;

// ==================================== Function exposed for the sake of binding
// /!\ NO VISUAL UPDATE IT'S A TRAP
function update_view() {
	robotController.updateView(
			robotMap.mm_start,
			robotMap.mm_end
		)
}

function do_route() {
	robotController.doRoute(
			robotMap.click_pos_mm,
			() => {	robotMap.deactivate_click();	}
		)
}

function do_dest(direction) {
	robotController.doDest(
			robotMap.click_pos_mm,
			direction,
			() => {	robotMap.deactivate_click();	}
		)
}

function restart_msg(mode) {
	robotController.softwareMessages(mode)
}

function mode(command) {
	robotController.changeMode(command)
}

function manu(command) {
	robotController.manualCommand(command)
}

function charger() {
    robotController.charger()
}

function do_del_maps() {
	robotController.deleteMaps(
		() => {
			robotMap.deactivate_click()
			robotMap.cleanseTheWorld()
		}
	)
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

// ============================================================= Start the stuff

// Create the map after the document is created
$(function() {
	robotMap = new RobotMap("map")
	robotController = new RobotController()

	// Initialize socket handlers
	robotController.onSocketOpen = () => {
		document.getElementById("wsdi_status")
			.innerHTML = "opened " + Util.sanitize(robotController.socket.extensions);
		document.getElementById("wsdi_status").textContent = "opened";
		$("#wsdi_card_status").removeClass("bg-flat-color-5 bg-flat-color-4 bg-flat-color-3 bg-flat-color-2 bg-flat-color-1");
		$("#wsdi_card_status").addClass("bg-flat-color-5");
	}
	robotController.onSocketClose = (event) => {
		document.getElementById("wsdi_status").textContent = "closed (Error: " + event.code + ")";
		$("#wsdi_card_status").removeClass("bg-flat-color-5 bg-flat-color-4 bg-flat-color-3 bg-flat-color-2 bg-flat-color-1");
		$("#wsdi_card_status").addClass("bg-flat-color-4");
	}
	robotController.onSocketError = (error) => {
		console.warn("Unable to connect");
		document.getElementById("wsdi_status").textContent = "closed (Error)";
		$("#wsdi_card_status").removeClass("bg-flat-color-5 bg-flat-color-4 bg-flat-color-3 bg-flat-color-2 bg-flat-color-1");
		$("#wsdi_card_status").addClass("bg-flat-color-4");
	}

	// Initialize controller callbacks
	robotController.onWorldRetrieve = (world) => {
		robotMap.changeTheWorld(world)
	}
	robotController.onPositionRetrieve = (position, angle) => {
		robotMap.setRobotPosition(	position.x, position.y, angle )
	}
	robotController.onChargingStateRetrieve = (flags, volt, volt_in, percent) => {
		let str = "";
		if (flags & CHARGE_FLAGS.CHARGING) str += "CHARGING ";
		if (flags & CHARGE_FLAGS.FULL) str += "FULL ";
		document.getElementById("bat_status")
			.textContent = volts / 1000 + "V  "
				+ volt_in +"V<i class='small-text'>in</i> "
				+ percent + "%  "
				+ str
	}
	robotController.onRouteRetrieve = (route) => {
		robotMap.activeRoute = route
	}
	robotController.onLastLidarRetrieve = (lidar, robot_angle) => {
		robotMap.last_lidar = lidar
	}
	document.getElementById("ws_url").textContent = Util.get_appropriate_ws_url(true);

	// Start the stuff
	robotMap.startRender()
	robotController.startConnection()
})

// On drags, zooms and redraws you should also retrieve a new view from the
// robot. It was in the previous version but the clean up made disappear
// as the map is now just a visual for a view
// Next up, adding the possibility to rebind these functions
