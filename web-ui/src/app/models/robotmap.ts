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


export enum BatteryState {
	UNKNOWN = -1,
	CHARGING = 1,
	FULL = 2
}

//  The shape of the robot, I'd like this to change promptly tho
//
//    0-------------------1
//    |                   |
//    |                   2
//    |            M  O     3
//    |                   4
//    |                   |
//    6-------------------5
//
export class Robot {
	dimensions: Vector2 	= new Vector2(750, 480)
	center: Vector2 			= new Vector2(500, 240)

	pos: Vector2 					= new Vector2()
	angle: number					= 0
	lastLidar: Lidar			= new Lidar()

	target: Vector2

	batteryState: BatteryState	= BatteryState.UNKNOWN
	batteryPercent: number			= -1
	voltIn: number				= -1
	volt: number 					= -1

	constructor() {

	}
}


export const ROBOT_SHAPE = [
    [-500, -240],
    [150, -240],
    [150, -100],
    [250, 0],
    [150, 100],
    [150, 240],
    [-500, 240]
];
