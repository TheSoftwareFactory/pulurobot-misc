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
