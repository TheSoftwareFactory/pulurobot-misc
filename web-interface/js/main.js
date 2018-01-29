// ======================================================================== Util

/**
* Html sanitizer, return a trustworthy string from the string in parameter
* s The string to sanitize
*/
function sanitize(s) {
  let htm = html_sanitize(s, function(url){return url;}, function(id){return id;})
  return html;
}

function get_appropriate_ws_url() {
    var pcol;
    var u = document.URL;

    if (u.substring(0, 5) == "https") {
        pcol = "wss://";
        u = u.substr(8);
    } else {
        pcol = "ws://";
        if (u.substring(0, 4) == "http")
            u = u.substr(7);
    }

    u = u.split('/');

    console.log(pcol + u[0] + "/xxx");
    return pcol + u[0] + "/xxx";
}


function get_appropriate_ws_url()
{
 return "wss://ojabotti.ha.fi:33333/xxx";
}

document.getElementById("ws_url").textContent = get_appropriate_ws_url();

// ========================================================================= Map

var canv = document.getElementById("map_canvas");
var ct = canv.getContext("2d");
var canv_w = canv.width;
var canv_h = canv.height;

var view_start_x = -3000;
var view_start_y = -3000;
var mm_per_pixel = 10.0;

var drag_start_x = 0.0;
var drag_start_y = 0.0;

var cur_angle = 0;
var cur_x = 0;
var cur_y = 0;

function update_view() {
    var view_end_x = view_start_x + canv_w * mm_per_pixel;
    var view_end_y = view_start_y + canv_h * mm_per_pixel;

    var buffer = new ArrayBuffer(17);

    new DataView(buffer).setUint8(0, 1);
    new DataView(buffer).setInt32(1, view_start_x, false);
    new DataView(buffer).setInt32(5, view_start_y, false);
    new DataView(buffer).setInt32(9, view_end_x, false);
    new DataView(buffer).setInt32(13, view_end_y, false);

    var view_blob = new Blob([buffer], {
        type: "application/octet-stream"
    });
    socket_di.send(view_blob);
}

function scroll_view(x, y) {
    //	view_start_x -= x*mm_per_pixel;
    //	view_start_y -= y*mm_per_pixel;

    update_view();
    draw_world();
}

var click_active = 0;
var click_x_mm = 0;
var click_y_mm = 0;

function activate_click() {
    click_active = 1;
    document.getElementById("route").style.display = "block";
    document.getElementById("direct_fwd").style.display = "block";
    document.getElementById("direct_back").style.display = "block";
    document.getElementById("rotate").style.display = "block";
    draw_world();
}

function deactivate_click() {
    click_active = 0;
    document.getElementById("route").style.display = "none";
    document.getElementById("direct_fwd").style.display = "none";
    document.getElementById("direct_back").style.display = "none";
    document.getElementById("rotate").style.display = "none";
    draw_world();
}

function handle_click(xpix, ypix) {
    click_x_mm = xpix * mm_per_pixel + view_start_x;
    click_y_mm = ypix * mm_per_pixel + view_start_y;
    activate_click();
}

function do_route() {
    var buffer = new ArrayBuffer(10);

    new DataView(buffer).setUint8(0, 2);
    new DataView(buffer).setInt32(1, click_x_mm, false);
    new DataView(buffer).setInt32(5, click_y_mm, false);
    new DataView(buffer).setUint8(9, 0);
    var view_blob = new Blob([buffer], {
        type: "application/octet-stream"
    });
    socket_di.send(view_blob);
    deactivate_click();
}

function do_direct_fwd() {
    do_dest(0);
}

function do_direct_back() {
    do_dest(1);
}

function do_rotate() {
    do_dest(8);
}

function do_dest(m) {
    var buffer = new ArrayBuffer(10);

    new DataView(buffer).setUint8(0, 7);
    new DataView(buffer).setInt32(1, click_x_mm, false);
    new DataView(buffer).setInt32(5, click_y_mm, false);
    new DataView(buffer).setUint8(9, m);
    var view_blob = new Blob([buffer], {
        type: "application/octet-stream"
    });
    socket_di.send(view_blob);
    deactivate_click();
}

function charger() {
    var buffer = new ArrayBuffer(1);
    new DataView(buffer).setUint8(0, 3);
    var view_blob = new Blob([buffer], {
        type: "application/octet-stream"
    });
    socket_di.send(view_blob);
}

function rn1host_restart() {
    restart_msg(1);
}

function rn1host_quit() {
    restart_msg(5);
}

function rn1host_update() {
    restart_msg(6);
}

function rn1host_reflash() {
    restart_msg(10);
}

function rn1host_reboot_raspi() {
    restart_msg(135);
}

function rn1host_shdn_raspi() {
    restart_msg(136);
}

function restart_msg(m) {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setUint8(0, 6);
    new DataView(buffer).setUint8(1, m);
    var view_blob = new Blob([buffer], {
        type: "application/octet-stream"
    });
    socket_di.send(view_blob);
}

function mode0() {
    mode(0);
}

function mode1() {
    mode(1);
}

function mode2() {
    mode(2);
}

function mode3() {
    mode(3);
}

function mode4() {
    mode(4);
}

function mode5() {
    mode(5);
}

function mode6() {
    mode(6);
}

function mode7() {
    mode(7);
}

function manu_fwd() {
    manu(10);
}

function manu_back() {
    manu(11);
}

function manu_left() {
    manu(12);
}

function manu_right() {
    manu(13);
}

function mode(m) {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setUint8(0, 4);
    new DataView(buffer).setUint8(1, m);
    var view_blob = new Blob([buffer], {
        type: "application/octet-stream"
    });
    socket_di.send(view_blob);
}

function manu(m) {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setUint8(0, 5);
    new DataView(buffer).setUint8(1, m);
    var view_blob = new Blob([buffer], {
        type: "application/octet-stream"
    });
    socket_di.send(view_blob);
}


var isDragging = false;

$(function() {
    function handleMouseDown(e) {
        var rect = canv.getBoundingClientRect();
        drag_start_x = parseInt(e.clientX - rect.left);
        view_x_at_drag_start = view_start_x;
        view_y_at_drag_start = view_start_y;
        drag_start_y = parseInt(e.clientY - rect.top);
        isDragging = true;
    }

    function handleMouseUp(e) {
        if (isDragging) {
            isDragging = false;

            var rect = canv.getBoundingClientRect();
            canMouseX = parseInt(e.clientX - rect.left);
            canMouseY = parseInt(e.clientY - rect.top);
            drag_x = canMouseX - drag_start_x;
            drag_y = canMouseY - drag_start_y;

            if (drag_x > -5 && drag_x < 5 && drag_y > -5 && drag_y < 5) {
                handle_click(canMouseX, canMouseY);
            } else {
                scroll_view(drag_x, drag_y);
            }
        }
    }

    function handleMouseOut(e) {
        handleMouseUp(e);
    }

    function handleMouseMove(e) {
        if (isDragging) {
            var rect = canv.getBoundingClientRect();
            drag_x = parseInt(e.clientX - rect.left) - drag_start_x;
            drag_y = parseInt(e.clientY - rect.top) - drag_start_y;

            view_start_x = view_x_at_drag_start - drag_x * mm_per_pixel;
            view_start_y = view_y_at_drag_start - drag_y * mm_per_pixel;

            draw_world();

        }
    }

    $("#map_canvas").mousedown(function(e) {
        handleMouseDown(e);
    });
    $("#map_canvas").mousemove(function(e) {
        handleMouseMove(e);
    });
    $("#map_canvas").mouseup(function(e) {
        handleMouseUp(e);
    });
    $("#map_canvas").mouseout(function(e) {
        handleMouseOut(e);
    });
});


function do_zoom_out() {
    mm_per_pixel *= 1.4;
    ct.clearRect(0, 0, canv_w, canv_h);
    draw_world();
    update_view();
}

function do_zoom_in() {
    mm_per_pixel *= 0.7;
    ct.clearRect(0, 0, canv_w, canv_h);
    draw_world();
    update_view();
}

// ================================================================= Web sockets

var socket_di;

if (typeof MozWebSocket != "undefined") {
    socket_di = new MozWebSocket(
      get_appropriate_ws_url(),
        "rn1-protocol");
} else {
    socket_di = new WebSocket(
      get_appropriate_ws_url(),
        "rn1-protocol");
}

var world = new Map();


function do_del_maps() {
    var buffer = new ArrayBuffer(1);

    new DataView(buffer).setUint8(0, 8);
    var view_blob = new Blob([buffer], {
        type: "application/octet-stream"
    });
    socket_di.send(view_blob);
    deactivate_click();
    world = new Map();
    draw_world();
}


function draw_robot(ang, x, y) {

}

//
//    0             1
//
//                  2
//           M  O     3
//                  4
//
//    6             5
//

var route_len = 0;
var route_start = [];
var route = [];

var last_lidar_len = 0;
var last_lidar;

var robot_shape = [
    [-500, -240],
    [150, -240],
    [150, -100],
    [250, 0],
    [150, 100],
    [150, 240],
    [-500, 240]
];

function set_robot_size(xs, ys, origin_xoffs, origin_yoffs) {
    // x coords
    robot_shape[0][0] = robot_shape[6][0] = -1 * (xs / 2 + origin_xoffs);
    robot_shape[1][0] = robot_shape[2][0] = robot_shape[4][0] = robot_shape[5][0] = xs / 2 - origin_xoffs;
    robot_shape[3][0] = robot_shape[2][0] + 100;

    // y coords
    robot_shape[0][1] = robot_shape[1][1] = -1 * (ys / 2 + origin_yoffs);
    robot_shape[5][1] = robot_shape[6][1] = ys / 2 - origin_yoffs;
    robot_shape[2][1] = -1 * origin_yoffs - 50;
    robot_shape[3][1] = -1 * origin_yoffs;
    robot_shape[4][1] = -1 * origin_yoffs + 50;
}

function draw_world() {
    ct.clearRect(0, 0, canv_w, canv_h);

    for (var [key, img] of world) {
        var img_x = (key[0] - view_start_x) / mm_per_pixel;
        var img_y = (key[1] - view_start_y) / mm_per_pixel;

        //console.log("x=" + key[0] + " y=" + key[1] + " --> " + img_x + "," + img_y + " is " + img);

        // let drawImage handle out-of-bounds coordinates, just try to draw everything
        ct.drawImage(img, img_x, img_y, (256 * 40) / mm_per_pixel, (256 * 40) / mm_per_pixel);
    }


    // Draw the robot

    var robot_x_pix = (cur_x - view_start_x) / mm_per_pixel;
    var robot_y_pix = (cur_y - view_start_y) / mm_per_pixel;


    ct.save();
    ct.translate(robot_x_pix, robot_y_pix);
    ct.rotate(cur_angle);
    ct.beginPath();
    ct.moveTo(robot_shape[0][0] / mm_per_pixel, robot_shape[0][1] / mm_per_pixel);
    for (var i = 0; i < 7; i++) {
        ct.lineTo(robot_shape[i][0] / mm_per_pixel, robot_shape[i][1] / mm_per_pixel);
    }
    ct.closePath();
    ct.fillStyle = "#C07040A0";
    ct.fill();
    ct.restore();

    if (route_len > 0) {

        ct.beginPath();
        ct.moveTo((route_start[0] - view_start_x) / mm_per_pixel, (route_start[1] - view_start_y) / mm_per_pixel);
        for (i = 0; i < route_len; i++) {
            ct.lineWidth = 3;
            if (route[i][2] > 0)
                ct.strokeStyle = "#C00000B0";
            else
                ct.strokeStyle = "#00C030B0";

            ct.lineTo((route[i][0] - view_start_x) / mm_per_pixel, (route[i][1] - view_start_y) / mm_per_pixel);
            ct.stroke();
            if (i < route_len - 1) {
                ct.beginPath();
                ct.moveTo((route[i][0] - view_start_x) / mm_per_pixel, (route[i][1] - view_start_y) / mm_per_pixel);
            }
        }
    }

    for (i = 0; i < last_lidar_len; i++) {
        ct.fillStyle = "red";
        ct.fillRect((last_lidar[i][0] - view_start_x) / mm_per_pixel - 1, (last_lidar[i][1] - view_start_y) / mm_per_pixel - 1, 2, 2);
    }

    if (click_active) {

        ct.fillStyle = "#FF7090C0";
        ct.fillRect((click_x_mm - view_start_x) / mm_per_pixel - 5, (click_y_mm - view_start_y) / mm_per_pixel - 5, 10, 10);

        ct.beginPath();
        ct.moveTo((cur_x - view_start_x) / mm_per_pixel, (cur_y - view_start_y) / mm_per_pixel);
        ct.lineWidth = 6;
        ct.strokeStyle = "#FF709090";
        ct.lineTo((click_x_mm - view_start_x) / mm_per_pixel, (click_y_mm - view_start_y) / mm_per_pixel);
        ct.stroke();
    }

}


try {
    socket_di.onopen = function() {
        document.getElementById("wsdi_status").innerHTML =
            " <b>opened</b> " +
            sanitize(socket_di.extensions);
    }

    socket_di.onmessage = function got_packet(msg) {
        if (msg.data instanceof Blob) {
            var fileReader = new FileReader();
            fileReader.onload = function() {
                var arrayBuffer = this.result;
                var view = new Uint8Array(arrayBuffer.slice(0, 3));

                var pay_size = view[1] * 256 + view[2];

                switch (view[0]) {
                    case 200:
                        {
                            var image = new Image();
                            image.onload = function() {
                                draw_world();
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
                    case 130:
                        {
                            cur_angle = (new DataView(arrayBuffer.slice(3, 5)).getInt16(0, false)) / 65536 * 2 * Math.PI;
                            cur_x = (new DataView(arrayBuffer.slice(5, 9)).getInt32(0, false));
                            cur_y = (new DataView(arrayBuffer.slice(9, 13)).getInt32(0, false));
                            draw_world();
                        }
                        break;

                    case 134:
                        {
                            var flags = (new DataView(arrayBuffer).getUint8(3));

                            var str = "";
                            if (flags & 1)
                                str += " CHARGING ";
                            if (flags & 2)
                                str += " FULL ";

                            var volts = (new DataView(arrayBuffer).getUint16(4, false));
                            var percentage = (new DataView(arrayBuffer).getUint8(6));

                            document.getElementById("bat_status").textContent = volts / 1000 + "V  " + percentage + "%  " + str;
                        }
                        break;

                    case 135:
                        {
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

                            draw_world();

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

            //				var reader = new FileReader();
            //				reader.addEventListener("loadend", function() {});
            //				reader.readAsArrayBuffer(msg.data);

        }
    }

    socket_di.onerror = function(e) {
      console.warn(e);
    }

    socket_di.onclose = function() {
        document.getElementById("wsdi_status").textContent = "closed";
        $("#wsdi_card_status").removeClass("bg-flat-color-3 bg-flat-color-2 bg-flat-color-1");
        $("#wsdi_card_status").addClass("bg-flat-color-4");

    }
} catch (exception) {
    alert('<p>Error' + exception);
}

var socket_status, jso, s;

if (typeof MozWebSocket != "undefined") {
    socket_status = new MozWebSocket(get_appropriate_ws_url(),
        "lws-status");
} else {
    socket_status = new WebSocket(get_appropriate_ws_url(),
        "lws-status");
}


try {
    socket_status.onopen = function() {}

    socket_status.onmessage = function got_packet(msg) {}

    socket_status.onclose = function() {}
} catch (exception) {
    alert('<p>Error' + exception);
}

//function reset() {
//	socket_di.send("reset\n");
//}

function redraw() {
    update_view();
    draw_world();
}

var socket_ot;

function ot_open() {
    if (typeof MozWebSocket != "undefined") {
        socket_ot = new MozWebSocket(get_appropriate_ws_url(),
            "rn1-protocol");
    } else {
        socket_ot = new WebSocket(get_appropriate_ws_url(),
            "rn1-protocol");
    }
    try {
        socket_ot.onopen = function() {
            document.getElementById("ot_statustd").style.backgroundColor = "#40ff40";
            document.getElementById("ot_status").innerHTML = " <b>OPENED</b><br>" + sanitize(socket_di.extensions);
            document.getElementById("ot_open_btn").disabled = true;
            document.getElementById("ot_close_btn").disabled = false;
            document.getElementById("ot_req_close_btn").disabled = false;
        }

        socket_ot.onclose = function(e) {
            document.getElementById("ot_statustd").style.backgroundColor = "#ff4040";
            document.getElementById("ot_status").textContent = " CLOSED code: " + e.code +
                ", reason: " + e.reason;
            document.getElementById("ot_open_btn").disabled = false;
            document.getElementById("ot_close_btn").disabled = true;
            document.getElementById("ot_req_close_btn").disabled = true;
        }
    } catch (exception) {
        alert('<p>Error' + exception);
    }
}

/* browser will close the ws in a controlled way */
function ot_close() {
    socket_ot.close(3000, "Bye!");
}

/* we ask the server to close the ws in a controlled way */
function ot_req_close() {
    socket_ot.send("closeme\n");
}
