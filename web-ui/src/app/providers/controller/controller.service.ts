import { Injectable } from '@angular/core';
import { RobotController, CommandCode, ReceptionCode, Modes } from "../../models/controller";
import { RobotRoute, Lidar, Robot } from "../../models/robotmap";
import { Vector2 } from "../../models/util";

export { RobotController, CommandCode, ReceptionCode, Modes, ManualCommands } from "../../models/controller";

@Injectable()
export class ControllerService {

  private controller: RobotController;

  public robot: Robot = new Robot();

  constructor() {
    this.controller = new RobotController()
    this.controller.robot = this.robot
  }

  startConnection() {
    this.controller.startConnection()
  }

  endConnection() {
    this.controller.endConnection()
  }

  //

  isConnecting(): boolean  {  return this.controller.isConnecting() }
  isOpen(): boolean        {  return this.controller.isOpen()       }
  isClosing(): boolean     {  return this.controller.isClosing()    }
  isClosed(): boolean      {  return this.controller.isClosed()     }

  //

  get url() : string    {   return this.controller.url }
  set url(url: string)  {   this.controller.url = url   }
  get history() {
    return this.controller.history
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

  set onWorldRetrieve( callback: (world: Map<any, any>) => void) {
    this.controller.onWorldRetrieve = callback
  }

  set onPositionRetrieve( callback: (position: Vector2, angle: number) => void) {
    this.controller.onPositionRetrieve = callback
  }

  set onChargingStateRetrieve( callback: ( flags: number, volt: number, volt_in: number, percentage: number) => void) {
    this.controller.onChargingStateRetrieve = callback
  }

  set onRouteRetrieve( callback: (route: RobotRoute) => void) {
    this.controller.onRouteRetrieve = callback
  }

  set onLastLidarRetrieve( callback: (lidar: Lidar, angle: number) => void) {
    this.controller.onLastLidarRetrieve = callback
  }
}
