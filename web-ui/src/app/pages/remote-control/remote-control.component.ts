import { Component, OnInit } from '@angular/core';

import { ControllerService, Modes } from "../../providers/controller/controller.service"

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

}
