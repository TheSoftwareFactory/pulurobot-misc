import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'arrow-pad',
  templateUrl: './arrow-pad.component.html',
  styleUrls: ['./arrow-pad.component.css']
})
export class ArrowPadComponent implements OnInit {

  @Output()
  left = new EventEmitter()

  @Output()
  right = new EventEmitter()

  @Output()
  up = new EventEmitter()

  @Output()
  down = new EventEmitter()

  constructor() {

  }

  ngOnInit() {
  }

}
