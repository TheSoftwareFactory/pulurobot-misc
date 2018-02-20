import { Component, OnInit } from '@angular/core';

import { Vector2 } from "../../models/util"
import { ControllerService } from "../../providers/controller/controller.service"
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  public world: Map<any, any> = new Map()

  constructor(private ctrlServ: ControllerService) {
    this.ctrlServ.onWorldRetrieve = (world: Map<any, any>) => {
        console.log("Got the world")
        this.world = world
      }
  }

  get robot() {
    return this.ctrlServ.robot
  }
  ngOnInit() {}

  routeToTarget() {
    this.ctrlServ.doRoute(this.ctrlServ.robot.target)
  }

  goForwardToTarget() {
    this.ctrlServ.doDest(this.ctrlServ.robot.target, 0)
  }

  goBackwardToTarget() {
    this.ctrlServ.doDest(this.ctrlServ.robot.target, 1)
  }

  rotateTowardTarget() {
    this.ctrlServ.doDest(this.ctrlServ.robot.target, 8)
  }

  goToCharger() {
    this.ctrlServ.charger()
  }

  updateView() {
    // Needs a binding with the map
    this.ctrlServ.updateView(new Vector2(-3000), new Vector2(3000))
  }

  stop() {
    this.ctrlServ.changeMode(5)
  }
}
