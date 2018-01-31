
let robotMap;
let robotController;

// ==================================== Function exposed for the sake of binding
// For more details on the use of these functions you can check
// in the controller.js file

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
// It's kept enclosed, so the only thing exposed to the page are the bindings of
// the buttons (above), classes, constants definitions
// and robotController/robotMap making it easier to deal with when using
// the console and keeping the window object clean

// Create the map after the document is created
$(function() {
	robotMap = new RobotMap("map")
	robotController = new RobotController()

	// Initialize socket handlers
	let cardElementJQ = $("#wsdi_card_status")
	let statusElement = document.getElementById("wsdi_status")
	let removeBackground = function(element) {
		element.removeClass("bg-flat-color-5 bg-flat-color-4 bg-flat-color-3 bg-flat-color-2 bg-flat-color-1")
		return element
	}

	robotController.onSocketOpen = () => {
	 	while (statusElement.lastChild) statusElement.removeChild(statusElement.lastChild)
		statusElement
			.innerHTML = "opened "
			+ '<br/><i class="fa fa-plug" aria-hidden="true"></i>'
			+ "<div class='small' style='font-style:italic'>("
				+ Util.sanitize(robotController.socket.extensions)
				+ ")</div>"
		removeBackground(cardElementJQ).addClass("bg-flat-color-5");
	}

	let oldSocketClose = robotController.onSocketClose
	robotController.onSocketClose = (event) => {
		oldSocketClose(event)
		if(event.code != 1000)
			statusElement.innerHTML = "closed (Error: " + event.code + ")" + '<br/><i class="fa fa-times" aria-hidden="true"></i>'
		else
			statusElement.innerHTML = "closed" + '<br/><i class="fa fa-times" aria-hidden="true"></i>'
		removeBackground(cardElementJQ).addClass("bg-flat-color-4");
	}

	robotController.onSocketError = (error) => {
		console.warn("Unable to connect");
		statusElement.innerHTML = "closed (Error)" + '<br/><i class="fa fa-times" aria-hidden="true"></i>'
		removeBackground(cardElementJQ).addClass("bg-flat-color-4");
	}

	robotController.onUrlChange = (url) => {
		document.getElementById("ws_url").textContent = url;
	}
	robotController.url = robotController.url	//Create the call to onUrlChange

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

	// Make sure to close the socket when you leave the page
	window.addEventListener("beforeunload", function (event) {
	  robotController.endConnection()
	})

	// Start the stuff
	robotMap.startRender()
	robotController.startConnection()
})

// On drags, zooms and redraws you should also retrieve a new view from the
// robot. It was in the previous version but the clean up made disappear
// as the map is now just a visual for a view
// Next up, adding the possibility to rebind these functions
// You can still manually update the view with the button on the right of the map tho
