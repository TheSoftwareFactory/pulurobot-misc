import { Component, OnInit } from '@angular/core';

import { ControllerService }	from "../../providers/controller/controller.service";


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  constructor(private controllerServ: ControllerService) { }

  ngOnInit() {
  }

  rn1hostRestart() {
    this.controllerServ.softwareMessage( 1 )
  }

  rn1hostQuit() {
    this.controllerServ.softwareMessage( 5 )
  }

  rn1hostUpdate() {
    this.controllerServ.softwareMessage( 6 )
  }

  rn1hostReflash() {
    this.controllerServ.softwareMessage( 10 )
  }

  rn1hostRebootRaspi() {
    this.controllerServ.softwareMessage( 135 )
  }

  rn1hostShutdownRaspi() {
    this.controllerServ.softwareMessage( 136 )
  }
}
