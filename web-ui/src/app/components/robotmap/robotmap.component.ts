import { Component,
  Input,
  ViewChild,
  ElementRef,
  HostBinding,
  OnInit,
  AfterViewInit,
  OnDestroy,
  NgZone } from '@angular/core';

import { Vector2, Angle } from "../../models/util";
import { RobotRoute, Lidar, Robot } from "../../models/robotmap";

@Component({
  selector: 'robotmap',
  templateUrl: './robotmap.component.html',
  styleUrls: ['./robotmap.component.css']
})
export class RobotmapComponent implements OnInit, AfterViewInit {

  // ======================================================================= Map
  // Possible options :
  //    zoom = true | false
  //    zoommin = number (in mm per pixel)
  //    zoommax = number (in mm per pixel)
  //    redraw = true | false
  //    details = true | false
  //		ratio = number
  // 		width = number (in px)
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

  @ViewChild("canvas") canvasRef: ElementRef;

  dimension: Vector2      = new Vector2();
  viewStart: Vector2     = new Vector2(-3000);
  private mm_per_pixel: number    = 10.0;
  private _canvas_px_ratio: number = 1;

  get clicked() : boolean {
    return this.robot.target != null
  }
  dragging: boolean       = false;
  drag_pos: Vector2        = new Vector2();

  @Input()
  robot: Robot            = new Robot()
  get angle() : number {  return +Angle.radToDeg(this.robot.angle).toFixed(1) }


  activeRoute: RobotRoute = new RobotRoute();

  @Input()
  public world: Map<any, any>     = new Map()

  private _rendering: boolean     = false;

  private _robotImg: any
  private _options: any = RobotmapComponent.default_options;

  constructor(private ngZone: NgZone) {
    this._robotImg = new Image(this.robot.dimensions.x, this.robot.dimensions.y)
    this._robotImg.src = "/assets/images/robot.png"
  }

  ngOnInit() {

    this.zoomFactor = .85

    this._zoommax = this.options.zoommax
    this._zoommin = this.options.zoommin

    this.updateScale()

    this.startRender()
  }

  ngAfterViewInit() {
    this.onResize()
  }

  ngOnDestroy() {
    this.stopRender()
  }

  @HostBinding('style.height.px') canvasDim: any;

  onResize(el?) : any {
    let rect = this.canvasRef.nativeElement.getBoundingClientRect()
    this.dimension = new Vector2(rect.width, rect.height);
    this._canvas_px_ratio = this.options.width / rect.width
    return rect
  }

  realToPixel(v: Vector2) { return Vector2.divideScalar(v, this.mm_per_pixel) }
  pixelToReal(v: Vector2) { return Vector2.multiplyScalar(v, this.mm_per_pixel)}

  get realStart() {
    return this.viewStart.copy()
  }

  get realDim() {
    return this.pixelToReal(this.dimension)
  }

  get realEnd() {
    return this.realDim.add(this.realStart)
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

  private _zoommax: number     = RobotmapComponent.default_options.zoommax;
  private _zoommin: number     = RobotmapComponent.default_options.zoommin;
  private _zoomFactorIn: number     = 0;
  private _zoomFactorOut: number    = 0;

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
    this.ngZone.runOutsideAngular(render)
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

    for(let [key, img] of this.world as any) {
      let pos = this.realToPixel(new Vector2(key[0], key[1]).sub(this.viewStart))

        // let drawImage handle out-of-bounds coordinates, just try to draw everything
        ctx.drawImage(img, pos.x, pos.y,
          (256 * 40) / this.mm_per_pixel,
          (256 * 40) / this.mm_per_pixel);
    }

    // Draw the robot

    let posRobotPx = this.realToPixel(Vector2.sub(this.robot.pos,this.viewStart))
    let imageOffset = this.realToPixel(this.robot.center.copy().negate())
    let robotDim = this.realToPixel(this.robot.dimensions)

    ctx.save()
    ctx.translate(posRobotPx.x, posRobotPx.y)
    ctx.rotate(this.robot.angle)
    ctx.drawImage(this._robotImg,imageOffset.x,imageOffset.y, robotDim.x, robotDim.y)
    ctx.restore()

    // Draw the route
    let len = this.activeRoute.length
    if (len > 0) {

      let startPx = this.realToPixel(Vector2.sub(this.activeRoute.start, this.viewStart))

      ctx.beginPath();
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.moveTo(startPx.x, startPx.y);

      for (let point of this.activeRoute.route) {
        let pointPx = this.realToPixel(Vector2.sub(point.coord, this.viewStart))
        ctx.lineWidth = 3;
        if (point.smthg > 0)
            ctx.strokeStyle = "#C00000B0"; //transparent red
        else
            ctx.strokeStyle = "#00C030B0"; // transparent green

        ctx.lineTo(pointPx.x, pointPx.y);
        ctx.stroke();
        // // This is questionnable tho
        // if (i != len - 1) {
        //     ctx.beginPath();
        //     ctx.moveTo(pointPx.x, pointPx.y);
        // }
      }
    }

    // Draws the last obstacles detected

    if(this.robot.lastLidar) {
      for (let point of this.robot.lastLidar.points) {
        let pointPx = this.realToPixel(Vector2.sub(point, this.viewStart))
        ctx.fillStyle = "red";
        ctx.fillRect(pointPx.x - 1, pointPx.y - 1, 2, 2);
      }
    }

    // If clicked draw the line to the click
    if (this.robot.target) {
      let posPx     = this.realToPixel(Vector2.sub(this.robot.pos, this.viewStart))
      let targetPx  = this.realToPixel(Vector2.sub(this.robot.target, this.viewStart))

      ctx.lineJoin  = "round"
      ctx.lineCap   = "round"
      ctx.fillStyle = "#FF7090C0";
      ctx.fillRect(targetPx.x - 5, targetPx.y - 5, 10, 10);

      ctx.beginPath();
      ctx.moveTo(posPx.x, posPx.y);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#FF709090";
      ctx.lineTo(targetPx.x, targetPx.y);
      ctx.stroke();
    }
  }

  // Events handling

  onMouseDown(e) {
    let rect = this.onResize()
    this.drag_pos.x = +(e.clientX - rect.left)
    this.drag_pos.y = +(e.clientY - rect.top)
    this.drag_pos.multiplyScalar(this._canvas_px_ratio)
    this.dragging = true
  }

  onMouseUp(e) {
    if(!this.dragging)  return

    this.dragging = false
    let rect = this.onResize()
    let drag_end = new Vector2(e.offsetX,e.offsetY)
    drag_end.multiplyScalar(this._canvas_px_ratio)
    // let drag_end = new Vector2(this.options.width, this.options.width/this.options.ratio)
    let drag = Vector2.sub(drag_end, this.drag_pos)

    // Below 5 pixels move, consider it as click
    if(drag.norm() < 5) {
      this.robot.target = this.pixelToReal(new Vector2(drag_end)).add(this.viewStart)
    }
  }

  onMouseOut(e) {
    this.onMouseUp(e)
  }

  onMouseMove(e) {
    if(!this.dragging)  return

    let rect = this.onResize()
    let drag = new Vector2(e.movementX, e.movementY)

    this.viewStart.sub(drag.multiplyScalar(this.mm_per_pixel))
  }

}
