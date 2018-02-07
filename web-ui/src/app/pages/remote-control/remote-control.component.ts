import { Component, OnInit } from '@angular/core';

import { ControllerService, Modes, ManualCommands } from "../../providers/controller/controller.service"

@Component({
  selector: 'app-remote-control',
  templateUrl: './remote-control.component.html',
  styleUrls: ['./remote-control.component.css']
})
export class RemoteControlComponent implements OnInit {

  constructor(private ctrlService: ControllerService) { }

  ngOnInit() {
  }

  get robot() {   return this.ctrlService.robot }

  left() {
    this.ctrlService.manualCommand( ManualCommands.TURN_LEFT )
  }

  right() {
    this.ctrlService.manualCommand( ManualCommands.TURN_RIGHT )
  }

  up() {
    this.ctrlService.manualCommand( ManualCommands.FORWARD )
  }

  down() {
    this.ctrlService.manualCommand( ManualCommands.BACKWARD )
  }

  stop() {
    this.ctrlService.changeMode(Modes.DISABLE_MOTOR_MAPPING)
  }

}
