import { Component, OnInit } from '@angular/core';

import { ControllerService }	from "../../providers/controller/controller.service";
import { AuthService, User, UserRole }        from "../../providers/auth.service"

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  name: string;
  pass: string;

  constructor(
    private controllerServ: ControllerService,
    private authServ: AuthService
  ) { }

  ngOnInit() {
  }

  login() {
    this.authServ.login( this.name, this.pass )
    console.log(this.name, this.pass,this.authServ )
  }

  logged(): boolean {
    return this.authServ.logged()
  }

  loggedAsAdmin(): boolean {
    return this.authServ.logged() && this.authServ.user.role == UserRole.ADMIN
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
