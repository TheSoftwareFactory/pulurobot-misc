import { Vector2 } from "./util";

// ================================================================ Some classes

export class RobotRoute {
	start: Vector2			= new Vector2();
	route: Array<{coord: Vector2, smthg: any}> = [];

	constructor() {	}

	changeStart(x, y) {
		this.start.x = x
		this.start.y = y
	}

	addPoint(x, y, smthg) {
		this.route.push({ coord: new Vector2(x, y), smthg: smthg})
	}

	get length() {
		return this.route.length
	}
}

export class Lidar {
	points: Array<Vector2> = [];

	constructor() {}

	addPoint(x, y) {
		this.points.push(new Vector2(x, y))
	}

	get length() {
		return this.points.length
	}
}

// ========================================================================= Map
// Possible options :
//    zoom = true | false
//    zoommin = number (in mm per pixel)
//    zoommax = number (in mm per pixel)
//    redraw = true | false
//    details = true | false
//		ratio = number
// 		width = number (in px)


//  The shape of the robot, I'd like this to change promptly tho
//
//    0-------------1
//    |             |
//    |             2
//    |      M  O     3
//    |             4
//    |             |
//    6-------------5
//

export const ROBOT_SHAPE = [
    [-500, -240],
    [150, -240],
    [150, -100],
    [250, 0],
    [150, 100],
    [150, 240],
    [-500, 240]
];
