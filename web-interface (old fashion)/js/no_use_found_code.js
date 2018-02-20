
let socket_status = createWebSocket(get_appropriate_ws_url(), "lws-status")
let jso, s;

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

var socket_ot;

function ot_open() {
    socket_ot = createWebSocket(get_appropriate_ws_url(), "rn1_protocol")

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
