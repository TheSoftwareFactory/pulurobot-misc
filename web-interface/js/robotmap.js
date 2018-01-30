// ================================================================ Some classes

class RobotRoute {
	constructor() {
		this.start = new Vector2()
		this.route = []
	}

	changeStart(x, y) {
		this.start.x = x
		this.start.y = y
	}

	addPoint(x, y, smthg) {
		this.route.push({ coord: new Vector2(x, y), smthg: smthg})
	}

	get length() {
		return this.route.length
	}
}

class Lidar {
	constructor() {
		this.points = []
	}

	addPoint(x, y) {
		this.points.push(new Vector2(x, y))
	}

	get length() {
		return this.points.length
	}
}

// ========================================================================= Map
// Possible options :
//    zoom = true | false
//    zoommin = number (in mm per pixel)
//    zoommax = number (in mm per pixel)
//    redraw = true | false
//    details = true | false


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

let robot_shape = [
    [-500, -240],
    [150, -240],
    [150, -100],
    [250, 0],
    [150, 100],
    [150, 240],
    [-500, 240]
];

class RobotMap {

  static get default_options() {
    return { zoom: true, zoommin: 1, zoommax: 25, details: true, redraw: false}
  }

  constructor(id = "map", options = { }) {

    for(let key of Object.keys(RobotMap.default_options)) {
      if(options[key] === undefined)  options[key] = RobotMap.default_options[key]
    }

    this.wrapper = document.getElementById(id)
    while (this.wrapper.lastChild) this.wrapper.removeChild(this.wrapper.lastChild)

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
    this.click_pos_mm = new Vector2()
    this.dragging = false
    this.drag_pos = new Vector2()

    this.angle = 0
    this.pos = new Vector2()

    this.activeRoute  = new RobotRoute()
    this.last_lidar   = new Lidar()

    this.world = new Map()
    this.rendering = false

    this.canvas.onmousedown = (e) => {  this.onMouseDown(e);  }
    this.wrapper.onmouseup   = (e) => {  this.onMouseUp(e);    }
    this.wrapper.onmousemove = (e) => {  this.onMouseMove(e);  }
    this.wrapper.onmouseout  = (e) => {  this.onMouseOut(e);   }

    // document.getElementById('redraw').onclick   = redraw;
    if(options.zoom)    this.createZoom()
    if(options.redraw)  this.createRedraw()
    if(options.details) this.createRobotDetails()
    this.zoommax = options.zoommax
    this.zoommin = options.zoommin

    this.setRobotPosition(0,0,0)
  }

  setRobotPosition(angle, x, y) {
    this.pos.x = x
    this.pos.y = y
    this.angle = angle
    this.updateRobotPosition()
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
    this._scale.style.width = "50px"
    this._scale.style.maxWidth = "50px"
    this.updateScale()

    this._zoomsElement.appendChild(zoomoutEl)
    this._zoomsElement.appendChild(this._scale)
    this._zoomsElement.appendChild(zoominEl)
    this.wrapper.appendChild(this._zoomsElement)
  }

  createRobotDetails() {
    if(this._robotDetailsEl)  return
    this._robotDetailsEl = document.createElement("div")
    this._robotDetailsEl.className = "overlay-bottom-right light-overlay"

    this._pRobotCoordinatesEl = document.createElement("span")
    this._robotDetailsEl.appendChild(this._pRobotCoordinatesEl)
    this.wrapper.appendChild(this._robotDetailsEl)
  }

  updateRobotPosition() {
    if(!this._pRobotCoordinatesEl)  return
    this._pRobotCoordinatesEl.innerHTML = "<i>x: "+this.pos.x+"</i>"
      + " - <i>y: "+this.pos.y+"</i>"
      + " - <i>angle: "+Math.round(Angle.radToDeg(this.angle)*10)/10+"°</i>"
  }

  updateScale() {
    if(!this._scale)  return
    let val = this.mm_per_pixel * 50
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
    redEl.onclick = (e) => {  this.draw(); }

    this._redrawEl.appendChild(redEl)
    this.wrapper.appendChild(this._redrawEl)
  }

  // Modify this to grant the possibility to have two maps on the same page
  activate_click() {
    this.clicked = true
    document.getElementById("route").style.display = "block";
    document.getElementById("direct_fwd").style.display = "block";
    document.getElementById("direct_back").style.display = "block";
    document.getElementById("rotate").style.display = "block";
  }

  deactivate_click() {
    this.clicked = false
    document.getElementById("route").style.display = "none";
    document.getElementById("direct_fwd").style.display = "none";
    document.getElementById("direct_back").style.display = "none";
    document.getElementById("rotate").style.display = "none";
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
      console.error("You must set a zoom factor with a reasonable scaling (below 10, 10 included)")
      return
    } else if(factor == 1) {
      console.warn("This is acceptable but zooming with a 1:1 ratio, is kinda useless...")
      this._zoomFactorIn = 0
      this._zoomFactorOut = 0
    } else if(factor > 1) {
      // Above 1, set the out factor first
      this._zoomFactorOut = factor
      this._zoomFactorIn = 1/(factor)
    } else {
      // Below 1 set the in factor first
      this._zoomFactorIn = factor
      this._zoomFactorOut = 1/(factor)
    }
  }

  zoom_in() {
    let next_mpp =  this.mm_per_pixel * this._zoomFactorIn
    if(next_mpp < this.zoommin)  return
    this.mm_per_pixel = next_mpp
    this.mm_per_pixel = Math.round(this.mm_per_pixel*100000) / 100000
    this.context.clearRect(0,0, this.dimension.x, this.dimension.y)

    this.updateScale()
  }

  zoom_out() {
    let next_mpp =  this.mm_per_pixel * this._zoomFactorOut
    if(next_mpp > this.zoommax)  return
    this.mm_per_pixel = next_mpp
    this.mm_per_pixel = Math.round(this.mm_per_pixel*100000) / 100000
    this.context.clearRect(0,0, this.dimension.x, this.dimension.y)

    this.updateScale()
  }

  changeTheWorld(world) {
    this.world = world
  }

  cleanseTheWorld() {
    this.world = new Map()
  }

  /**
  * This ensure that you are not gonna redraw out of the blue. You'll redraw
  * you'll redraw when the browser is ready.
  * Plus, you don't need to refresh the drawings anywhere after calling this
  */
  startRender() {
    this.rendering = true
    let render = () => {
      if(!this.rendering) return
      this.draw()
      requestAnimationFrame(() => { render() })
    }
    render()
  }

  /**
  * If for some reason you need to stop the render of the map call this.
  * If you need to destroy the map, please, call this !
  */
  stopRender() {
    this.rendering = false
  }

  /**
  * Draws the full world, the robot and other things
  */
  draw() {
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
    for (let i = 0; i < 7; i++) {
        this.context.lineTo(robot_shape[i][0] / this.mm_per_pixel, robot_shape[i][1] / this.mm_per_pixel);
    }
    this.context.closePath();

    this.context.fillStyle = "#C07040A0";
    this.context.fill();
    this.context.restore();

    // Draw the route
    let len = this.activeRoute.length
    if (len > 0) {

        this.context.beginPath();
        this.context.lineJoin = "round"
        this.context.lineCap = "round"
        this.context.moveTo(
          (this.activeRoute.start.x - this.view_start.x) / this.mm_per_pixel,
          (this.activeRoute.start.y - this.view_start.y) / this.mm_per_pixel);
        for (let i = 0; i < len; i++) {
            let point = this.activeRoute.route[i]
            this.context.lineWidth = 3;
            if (point.smthg > 0)
                this.context.strokeStyle = "#C00000B0"; //transparent red
            else
                this.context.strokeStyle = "#00C030B0"; // transparent green

            this.context.lineTo(
              (point.coord.x - this.view_start.x) / this.mm_per_pixel,
              (point.coord.y - this.view_start.y) / this.mm_per_pixel);
            this.context.stroke();
            // This is questionnable tho
            if (i != len - 1) {
                this.context.beginPath();
                this.context.moveTo(
                  (point.coord.x - this.view_start.x) / this.mm_per_pixel,
                  (point.coord.y - this.view_start.y) / this.mm_per_pixel);
            }
        }
    }

    // Draws the last obstacles detected

    for (let i = 0; i < this.last_lidar.length; i++) {
        this.context.fillStyle = "red";
        this.context.fillRect(
          (this.last_lidar.points[i].x - this.view_start.x) / this.mm_per_pixel - 1,
          (this.last_lidar.points[i].y - this.view_start.y) / this.mm_per_pixel - 1,
          2, 2);
    }

    if (this.clicked) {
      this.context.lineJoin = "round"
      this.context.lineCap = "round"
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
    // else
    //   this.draw()
  }

  onMouseOut(e) {
    this.onMouseUp(e)
  }

  onMouseMove(e) {
    if(!this.dragging)  return

    let rect = this.canvas.getBoundingClientRect()
    let drag = new Vector2(e.movementX, e.movementY)

    this.view_start.sub(drag.multiplyScalar(this.mm_per_pixel))
    //

  }
}
