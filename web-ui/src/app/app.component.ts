import { Component } from '@angular/core';

import { ControllerService }	from "./providers/controller/controller.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private controllerService: ControllerService) {

  }

  get url() {
    return this.controllerService.url
  }

  get voltIn() {
    let vi = this.controllerService.robot.voltIn
    return (vi>0?vi:"n/a")
  }
  get volt() {
    let v = this.controllerService.robot.volt
    return (v>0?v:"n/a")
  }
  get percent() {
    let p = Math.round(this.controllerService.robot.batteryPercent)
    return (p>0?p:0)
  }
  get batteryFill() {
    return "fa fa-battery-" + Math.round(this.percent/100*4)
  }

  start() {
    this.controllerService.startConnection()
  }
  end() {
    this.controllerService.endConnection()
  }
  isConnecting(): boolean  {  return this.controllerService.isConnecting() }
  isOpen(): boolean        {  return this.controllerService.isOpen()       }
  isClosing(): boolean     {  return this.controllerService.isClosing()    }
  isClosed(): boolean      {  return this.controllerService.isClosed()     }
}
