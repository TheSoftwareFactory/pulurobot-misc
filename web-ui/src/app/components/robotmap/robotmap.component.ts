import { Component, Input, ViewChild, ElementRef, HostBinding, OnInit, OnDestroy } from '@angular/core';

import { Vector2, Angle } from "../../models/util";
import { RobotRoute, Lidar, ROBOT_SHAPE } from "../../models/robotmap";

@Component({
  selector: 'robotmap',
  templateUrl: './robotmap.component.html',
  styleUrls: ['./robotmap.component.css']
})
export class RobotmapComponent implements OnInit {

  static default_options: any = { zoom: true, zoommin: 1, zoommax: 25, details: true, redraw: false, ratio: 4/3, width: 1000 };

  @Input()
  set options(opt: any) {
    for(let key of Object.keys(RobotmapComponent.default_options)) {
        this._options[key] = (opt[key] === undefined?RobotmapComponent.default_options[key]:opt[key]);
    }
  }

  get options() {
    return this._options;
  }

  _options: any = RobotmapComponent.default_options;

  @ViewChild("canvas") canvasRef: ElementRef;

  dimension: Vector2      = new Vector2();

  view_start: Vector2     = new Vector2(-3000);
  mm_per_pixel: number    = 10.0;

  clicked: boolean        = false;
  click_pos_mm: Vector2   = new Vector2();
  dragging: boolean       = false;
  drag_pos: Vector2        = new Vector2();

  angle: number           = 0;
  pos: Vector2            = new Vector2();

  lastLidar: Lidar        = new Lidar();
  activeRoute: RobotRoute = new RobotRoute();

  _world: Map<any, any>    = new Map();
  _rendering: boolean     = false;

  constructor() { }

  ngOnInit() {

    this.zoomFactor = .85

    this._zoommax = this.options.zoommax
    this._zoommin = this.options.zoommin

    this.setRobotPosition(0,0,0)
    this.updateScale()

    this.startRender()
  }

  ngOnDestroy() {
    this.stopRender()
  }

  @HostBinding('style.height.px') canvasDim: any;

  onResize(el: HTMLElement) {
    let rect = this.canvasRef.nativeElement.getBoundingClientRect()
    this.dimension = new Vector2(rect.width, rect.height);
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

  scaleText: string   = "500mm";

  updateScale() {
    if(!this.options.zoom)  return
    let val = this.mm_per_pixel * 50
    let s = ""
    if(val < 1)                       s = "1- mm"
    else if(val < 1000)               s = Math.round(val) + " mm"
    else if(val < 1000 * 100)         s = Math.round(val/100)/10 + " m"
    else if(val < 1000 * 1000 * 199)  s = Math.round(val/100/1000)/10 + " km"
    this.scaleText = s
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


  _zoommax: number     = RobotmapComponent.default_options.zoommax;
  _zoommin: number     = RobotmapComponent.default_options.zoommin;
  _zoomFactorIn: number     = 0;
  _zoomFactorOut: number    = 0;

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

  zoomIn() {
    let next_mpp =  this.mm_per_pixel * this._zoomFactorIn
    if(next_mpp < this._zoommin)  return
    this.mm_per_pixel = next_mpp
    this.mm_per_pixel = Math.round(this.mm_per_pixel*100000) / 100000

    this.updateScale()
  }

  zoomOut() {
    let next_mpp =  this.mm_per_pixel * this._zoomFactorOut
    if(next_mpp > this._zoommax)  return
    this.mm_per_pixel = next_mpp
    this.mm_per_pixel = Math.round(this.mm_per_pixel*100000) / 100000

    this.updateScale()
  }

  changeTheWorld(world: Map<any, any>) : Map<any, any> {
    return this._world = world
  }

  cleanseTheWorld() {
    this._world = new Map()
  }

  /**
  * This ensure that you are not gonna redraw out of the blue. You'll redraw
  * you'll redraw when the browser is ready.
  * Plus, you don't need to refresh the drawings anywhere after calling this
  */
  startRender() {
    this._rendering = true
    let render = () => {
      if(!this._rendering) return
      this._draw()
      requestAnimationFrame(() => { render() })
    }
    render()
  }

  /**
  * If for some reason you need to stop the render of the map call this.
  * If you need to destroy the map, please, call this !
  */
  stopRender() {
    this._rendering = false
  }

  /**
  * Draws the full world, the robot and other things
  */
  private _draw() {
    let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d')
    // Little trick to deal with resizing
    ctx.clearRect(0, 0, Math.max(this.dimension.x, 2000), Math.max(this.dimension.y, 2000))

    for(let [key, img] of this._world as any) {
      let pos = new Vector2(key[0], key[1])
        .sub(this.view_start)
        .divideScalar(this.mm_per_pixel)

        // let drawImage handle out-of-bounds coordinates, just try to draw everything
        ctx.drawImage(img, pos.x, pos.y,
          (256 * 40) / this.mm_per_pixel,
          (256 * 40) / this.mm_per_pixel);
    }

    // Draw the robot (ugly design tho, this should propably replaced by an more appealing image)

    let pos_robot_pix = Vector2.sub(this.pos,this.view_start)
      .divideScalar(this.mm_per_pixel);

    ctx.save()
    ctx.translate(pos_robot_pix.x, pos_robot_pix.y)
    ctx.rotate(this.angle)

    ctx.beginPath()
    ctx.moveTo(ROBOT_SHAPE[0][0] / this.mm_per_pixel, ROBOT_SHAPE[0][1] / this.mm_per_pixel);
    for (let i = 0; i < 7; i++) {
        ctx.lineTo(ROBOT_SHAPE[i][0] / this.mm_per_pixel, ROBOT_SHAPE[i][1] / this.mm_per_pixel);
    }
    ctx.closePath();

    ctx.fillStyle = "#C07040A0";
    ctx.fill();
    ctx.restore();

    // Draw the route
    let len = this.activeRoute.length
    if (len > 0) {

        ctx.beginPath();
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        ctx.moveTo(
          (this.activeRoute.start.x - this.view_start.x) / this.mm_per_pixel,
          (this.activeRoute.start.y - this.view_start.y) / this.mm_per_pixel);
        for (let i = 0; i < len; i++) {
            let point = this.activeRoute.route[i]
            ctx.lineWidth = 3;
            if (point.smthg > 0)
                ctx.strokeStyle = "#C00000B0"; //transparent red
            else
                ctx.strokeStyle = "#00C030B0"; // transparent green

            ctx.lineTo(
              (point.coord.x - this.view_start.x) / this.mm_per_pixel,
              (point.coord.y - this.view_start.y) / this.mm_per_pixel);
            ctx.stroke();
            // This is questionnable tho
            if (i != len - 1) {
                ctx.beginPath();
                ctx.moveTo(
                  (point.coord.x - this.view_start.x) / this.mm_per_pixel,
                  (point.coord.y - this.view_start.y) / this.mm_per_pixel);
            }
        }
    }

    // Draws the last obstacles detected

    if(this.lastLidar) {
      for (let i = 0; i < this.lastLidar.length; i++) {
          ctx.fillStyle = "red";
          ctx.fillRect(
            (this.lastLidar.points[i].x - this.view_start.x) / this.mm_per_pixel - 1,
            (this.lastLidar.points[i].y - this.view_start.y) / this.mm_per_pixel - 1,
            2, 2);
      }
    }

    if (this.clicked) {
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.fillStyle = "#FF7090C0";
      ctx.fillRect(
        (this.click_pos_mm.x - this.view_start.x) / this.mm_per_pixel - 5,
        (this.click_pos_mm.y - this.view_start.y) / this.mm_per_pixel - 5, 10, 10);

      ctx.beginPath();
      ctx.moveTo((this.pos.x - this.view_start.x) / this.mm_per_pixel,
        (this.pos.y - this.view_start.y) / this.mm_per_pixel);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#FF709090";
      ctx.lineTo((this.click_pos_mm.x - this.view_start.x) / this.mm_per_pixel,
        (this.click_pos_mm.y - this.view_start.y) / this.mm_per_pixel);
      ctx.stroke();
    }
  }

  // Events handling

  onMouseDown(e) {
    let rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drag_pos.x = +(e.clientX - rect.left)
    this.drag_pos.y = +(e.clientY - rect.top)
    this.dragging = true
  }

  onMouseUp(e) {
    if(!this.dragging)  return

    this.dragging = false
    let rect = this.canvasRef.nativeElement.getBoundingClientRect()
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

    let rect = this.canvasRef.nativeElement.getBoundingClientRect()
    let drag = new Vector2(e.movementX, e.movementY)

    this.view_start.sub(drag.multiplyScalar(this.mm_per_pixel))
  }

}
