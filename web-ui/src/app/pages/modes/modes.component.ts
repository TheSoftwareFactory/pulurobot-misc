import { Component, OnInit } from '@angular/core';

import { ControllerService, Modes } from "../../providers/controller/controller.service"

@Component({
  selector: 'app-modes',
  templateUrl: './modes.component.html',
  styleUrls: ['./modes.component.css']
})
export class ModesComponent implements OnInit {

  Modes = Modes

  constructor(private controllerService: ControllerService) { }

  ngOnInit() {
  }

  changeMode(mode: Modes) {
    this.controllerService.changeMode(mode)
  }

}
