import { Injectable } from '@angular/core';
import { RobotController } from "../../models/controller";
import { RobotRoute, Lidar } from "../../models/robotmap";
import { Vector2 } from "../../models/util";

@Injectable()
export class ControllerService {

  private controller: RobotController;

  constructor() { }

  startConnection() {
    this.controller.startConnection()
  }

  endConnection() {
    this.controller.endConnection()
  }

  // Commands

  updateView( start: Vector2, end: Vector2 ) {
    this.controller.updateView(start, end)
  }

  doRoute( target: Vector2 ) {
    this.controller.doRoute( target )
  }

  doDest( target: Vector2, command: number ) {
    this.controller.doDest( target, command )
  }

  softwareMessage( type: number, callback = null ) {
    this.controller.softwareMessages( type )
  }

  changeMode( mode: number ) {
    this.controller.changeMode( mode )
  }

  manualCommand( command: number ) {
    this.controller.manualCommand( command )
  }

  charger( ) {
    this.controller.charger( )
  }

  deleteMaps( ) {
    this.controller.deleteMaps( )
  }

  // Reception

  set onWorldRetrieve( callback: (world: Map<any, any>) => {}) {
    this.controller.onWorldRetrieve = callback
  }

  set onPositionRetrieve( callback: (position: Vector2, angle: number) => {}) {
    this.controller.onPositionRetrieve = callback
  }

  set onChargingStateRetrieve( callback: ( flags: number, volt: number, volt_in: number, percentage: number) => {}) {
    this.controller.onChargingStateRetrieve = callback
  }

  set onRouteRetrieve( callback: (route: RobotRoute) => {}) {
    this.controller.onRouteRetrieve = callback
  }

  set onLastLidarRetrieve( callback: (lidar: Lidar, angle: number) => {}) {
    this.controller.onLastLidarRetrieve = callback
  }
}
