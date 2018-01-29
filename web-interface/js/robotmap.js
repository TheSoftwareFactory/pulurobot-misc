// ========================================================================= Map
// Possible options :
//    zoom = true | false
//    redraw = true | false


//  The shape of the robot, I'd like this to change promptly tho
//
//    0-------------1
//    |             |
//    |             2
//    |      M  O     3
//    |             4
//    |             |
//    6-------------5
//

var robot_shape = [
    [-500, -240],
    [150, -240],
    [150, -100],
    [250, 0],
    [150, 100],
    [150, 240],
    [-500, 240]
];

var route_len = 0;
var route_start = [];
var route = [];

var last_lidar_len = 0;
var last_lidar;

class RobotMap {
  constructor(id = "map", options = { zoom: true, redraw: true}) {
    this.wrapper = document.getElementById(id)
    this.canvas = document.createElement("canvas")
    this.canvas.setAttribute("style", "width:100%; box-shadow: 0 2px 5px 0px grey inset;")
    this.canvas.setAttribute("width", 1000)
    this.canvas.setAttribute("height", 750)
    this.wrapper.appendChild(this.canvas)
    this.context = this.canvas.getContext("2d")

    let rect = this.canvas.getBoundingClientRect()
    this.dimension = new Vector2(rect.width, rect.height)

    this.view_start = new Vector2(-3000)
    this.mm_per_pixel = 10.0

    this.zoomFactor = .85

    this.clicked = false
    this.click_pos_mm = new Vector2(0)
    this.dragging = false
    this.drag_pos = new Vector2(0)

    this.angle = 0
    this.pos = new Vector2(0)

    this.world = new Map()

    this.canvas.onmousedown = (e) => {  this.onMouseDown(e);  }
    this.wrapper.onmouseup   = (e) => {  this.onMouseUp(e);    }
    this.wrapper.onmousemove = (e) => {  this.onMouseMove(e);  }
    this.wrapper.onmouseout  = (e) => {  this.onMouseOut(e);   }

    // document.getElementById('redraw').onclick   = redraw;
    if(options.zoom)    this.createZoom()
    if(options.redraw)  this.createRedraw()
  }

  setRobotPosition(angle, x, y) {
    this.pos.x = x
    this.pos.y = y
    this.angle = angle
  }

  get mm_start() {
    return this.view_start.copy()
  }

  get mm_dim() {
    return Vector2.multiplyScalar(this.dimension, this.mm_per_pixel)
  }

  get mm_end() {
    return this.mm_dim.add(this.view_start)
  }

  createZoom() {
    if(this._zoomsElement)  return
    this._zoomsElement = document.createElement("div")
    this._zoomsElement.className = "overlay-top-right"

    let zoomoutEl = document.createElement("i")
    zoomoutEl.className = "fa fa-minus-square clickable"
    zoomoutEl.setAttribute("style", "font-size: 2em; line-height: 1em")
    zoomoutEl.onclick = (e) => {  this.zoom_out(); }

    let zoominEl = document.createElement("i")
    zoominEl.className = "fa fa-plus-square clickable"
    zoominEl.setAttribute("style", "font-size: 2em; line-height: 1em")
    zoominEl.onclick = (e) => {  this.zoom_in(); }

    this._scale = document.createElement("div")
    this._scale.setAttribute(
      "style",
      "display: inline-block; font-size: .6em; line-height: 1em; padding-bottom: 5px; margin: 0 8px; border-radius: 2px; border-bottom: 3px black solid; text-align: center")
    this._scale.style.width = "40px"
    this._scale.style.maxWidth = "40px"
    this.updateScale()

    this._zoomsElement.appendChild(zoomoutEl)
    this._zoomsElement.appendChild(this._scale)
    this._zoomsElement.appendChild(zoominEl)
    this.wrapper.appendChild(this._zoomsElement)
  }

  updateScale() {
    let val = this.mm_per_pixel * 40
    let s = ""
    if(val < 1)                       s = "1- mm"
    else if(val < 1000)               s = Math.round(val) + " mm"
    else if(val < 1000 * 100)         s = Math.round(val/100)/10 + " m"
    else if(val < 1000 * 1000 * 199)  s = Math.round(val/100/1000)/10 + " km"
    this._scale.innerHTML = s
  }

  createRedraw() {
    if(this._redrawEl)  return
    this._redrawEl = document.createElement("div")
    this._redrawEl.className = "overlay-top-left"

    let redEl = document.createElement("i")
    redEl.className = "fa fa-refresh clickable"
    redEl.setAttribute("style", "font-size: 2em")
    redEl.onclick = (e) => {  this.draw_world(); }

    this._redrawEl.appendChild(redEl)
    this.wrapper.appendChild(this._redrawEl)
  }

  // Modify this to grant the possibility to have the two maps on the same page
  activate_click() {
    this.clicked = true
    document.getElementById("route").style.display = "block";
    document.getElementById("direct_fwd").style.display = "block";
    document.getElementById("direct_back").style.display = "block";
    document.getElementById("rotate").style.display = "block";
    this.draw_world()
  }

  deactivate_click() {
    this.clicked = false
    document.getElementById("route").style.display = "none";
    document.getElementById("direct_fwd").style.display = "none";
    document.getElementById("direct_back").style.display = "none";
    document.getElementById("rotate").style.display = "none";
    this.draw_world()
  }

  handle_click(x, y) {
    this.click_pos_mm = new Vector2(x,y)
      .multiplyScalar(this.mm_per_pixel)
      .add(this.view_start);
    this.activate_click();
  }

  set zoomFactor(factor) {
    if(factor <= 0) {
      console.error("You must set a zoom factor above 0 (and not greater than 10)")
      return
    } else if (factor > 10) {
      console.error("You must set a zoom factor with a reasonable scaling (below 10, 10 include)")
      return
    } else if(factor == 1) {
      console.warn("This is acceptable but zooming with a 1:1 ratio, is kinda useless...")
      this._zoomFactorIn = 0
      this._zoomFactorOut = 0
    } else if(factor > 1) {
      // Above 1, set the out factor first
      factor -= 1
      this._zoomFactorOut = factor
      this._zoomFactorIn = factor/(factor+1)
    } else {
      // Below 1 set the in factor first
      console.log(1-factor)
      factor = 1 - factor
      this._zoomFactorIn = factor
      this._zoomFactorOut = factor/(1-factor)
    }
  }

  zoom_in() {
    let next_mpp =  this.mm_per_pixel * 1 - this._zoomFactorIn
    if(next_mpp < 1)  return
    this.mm_per_pixel *= 1 - this._zoomFactorIn
    this.mm_per_pixel = Math.round(this.mm_per_pixel*100000) / 100000
    this.context.clearRect(0,0, this.dimension.x, this.dimension.y)
    this.draw_world()
    this.updateScale()
  }

  zoom_out() {
    this.mm_per_pixel *= 1 + this._zoomFactorOut
    this.mm_per_pixel = Math.round(this.mm_per_pixel*100000) / 100000
    this.context.clearRect(0,0, this.dimension.x, this.dimension.y)
    this.draw_world()
    this.updateScale()
  }

  changeTheWorld(world) {
    this.world = world
  }

  /**
  * Draws the full world
  */
  draw_world() {
    // Little trick to deal with resizing
    this.context.clearRect(0, 0, Math.max(this.dimension.x, 2000), Math.max(this.dimension.y, 2000))

    for(let [key, img] of this.world) {
      let pos = new Vector2(key[0], key[1])
        .sub(this.view_start)
        .divideScalar(this.mm_per_pixel)

        // let drawImage handle out-of-bounds coordinates, just try to draw everything
        this.context.drawImage(img, pos.x, pos.y,
          (256 * 40) / this.mm_per_pixel,
          (256 * 40) / this.mm_per_pixel);
    }

    // Draw the robot (ugly design tho, this should propably replaced by an more appealing image)

    let pos_robot_pix = Vector2.sub(this.pos,this.view_start)
      .divideScalar(this.mm_per_pixel);

    this.context.save()
    this.context.translate(pos_robot_pix.x, pos_robot_pix.y)
    this.context.rotate(this.angle)

    this.context.beginPath()
    this.context.moveTo(robot_shape[0][0] / this.mm_per_pixel, robot_shape[0][1] / this.mm_per_pixel);
    for (var i = 0; i < 7; i++) {
        this.context.lineTo(robot_shape[i][0] / this.mm_per_pixel, robot_shape[i][1] / this.mm_per_pixel);
    }
    this.context.closePath();

    this.context.fillStyle = "#C07040A0";
    this.context.fill();
    this.context.restore();

    // Draw the route

    if (route_len > 0) {

        this.context.beginPath();
        this.context.lineJoin = "round"
        this.context.lineCap = "round"
        this.context.moveTo(
          (route_start[0] - this.view_start.x) / this.mm_per_pixel,
          (route_start[1] - this.view_start.y) / this.mm_per_pixel);
        for (i = 0; i < route_len; i++) {
            this.context.lineWidth = 3;
            if (route[i][2] > 0)
                this.context.strokeStyle = "#C00000B0";
            else
                this.context.strokeStyle = "#00C030B0";

            this.context.lineTo(
              (route[i][0] - this.view_start.x) / this.mm_per_pixel,
              (route[i][1] - this.view_start.y) / this.mm_per_pixel);
            this.context.stroke();
            if (i < route_len - 1) {
                this.context.beginPath();
                this.context.moveTo(
                  (route[i][0] - this.view_start.x) / this.mm_per_pixel,
                  (route[i][1] - this.view_start.y) / this.mm_per_pixel);
            }
        }
    }

    // Draws smthg that I not yet figured out

    for (i = 0; i < last_lidar_len; i++) {
        this.context.fillStyle = "red";
        this.context.fillRect(
          (last_lidar[i][0] - this.view_start.x) / this.mm_per_pixel - 1,
          (last_lidar[i][1] - this.view_start.y) / this.mm_per_pixel - 1, 2, 2);
    }

    if (this.clicked) {

        this.context.fillStyle = "#FF7090C0";
        this.context.fillRect(
          (this.click_pos_mm.x - this.view_start.x) / this.mm_per_pixel - 5,
          (this.click_pos_mm.y - this.view_start.y) / this.mm_per_pixel - 5, 10, 10);

        this.context.beginPath();
        this.context.moveTo((this.pos.x - this.view_start.x) / this.mm_per_pixel,
          (this.pos.y - this.view_start.y) / this.mm_per_pixel);
        this.context.lineWidth = 6;
        this.context.strokeStyle = "#FF709090";
        this.context.lineTo((this.click_pos_mm.x - this.view_start.x) / this.mm_per_pixel,
          (this.click_pos_mm.y - this.view_start.y) / this.mm_per_pixel);
        this.context.stroke();
    }
  }

  // Events handling

  onMouseDown(e) {
    let rect = this.canvas.getBoundingClientRect();
    this.drag_pos.x = +(e.clientX - rect.left)
    this.drag_pos.y = +(e.clientY - rect.top)
    this.dragging = true
  }

  onMouseUp(e) {
    if(!this.dragging)  return

    this.dragging = false
    let rect = this.canvas.getBoundingClientRect()
    let drag_end = new Vector2(+(e.clientX - rect.left),+(e.clientY - rect.top))
    let drag = Vector2.sub(drag_end, this.drag_pos)

    // Below 5 pixels move, consider it as click
    if(drag.norm() < 5)
      this.handle_click(drag_end.x, drag_end.y)
    else
      this.draw_world()
  }

  onMouseOut(e) {
    this.onMouseUp(e)
  }

  onMouseMove(e) {
    if(!this.dragging)  return

    let rect = this.canvas.getBoundingClientRect()
    let drag = new Vector2(e.movementX, e.movementY)

    this.view_start.sub(drag.multiplyScalar(this.mm_per_pixel))

    this.draw_world()
  }
}