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
    this.left.emit()
    this.right.emit()
    this.up.emit()
    this.down.emit()
  }

  ngOnInit() {
  }

  cleft() {
    this.left.emit()
  }

  cright() {
    this.right.emit()
  }

  cup() {
    this.up.emit()
  }

  cdown() {
    this.down.emit()
  }

}
