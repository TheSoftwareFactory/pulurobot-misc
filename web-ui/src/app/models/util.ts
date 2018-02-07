/**
* A class to wrap the comportement of mathematical vectors in 3 dimensions
* Names are pretty straight forward and all functions are designed to be
* serizalized (you can chain Vector2.function().function2().function3()...)
*/
export class Vector2 {

  public x: number;
  public y: number;

  constructor(v: Vector2);
  constructor(x?: number, y?: number);
  constructor(vx: any = 0, y: number = vx) {
    if(vx instanceof Vector2) {
      this.x = vx.x
      this.y = vx.y
    } else {
      this.x = vx || 0
      if(isNaN(y))  this.y = vx || 0
      else this.y = y || 0
    }
  }

  addScalar(m) {
    this.x += m
    this.y += m
    return this
  }

  subScalar(m) {
    return this.addScalar(-m)
  }

  multiplyScalar(m) {
    this.x *= m
    this.y *= m
    return this
  }

  divideScalar(m) {
    return this.multiplyScalar(1/m)
  }

  add(v) {
    this.x += v.x
    this.y += v.y
    return this
  }

  sub(v) {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  negate() {
    this.x = -this.x
    this.y = -this.y
    return this
  }

  dot(v) {
    return this.x * v.x + this.y * v.y
  }

  crossZ(v) {
    return this.x * v.y - this.y*v.x
  }

  copy() {
    return new Vector2(this.x, this.y)
  }

  norm() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
  }

  normalize() {
    if(!this.isZero())
      return this.divideScalar(this.norm())
    return this
  }

  equals(v) {
    return this.x==v.x && this.y==v.y
  }

  isZero() {
    return this.x == 0 && this.y == 0
  }

  static addScalar(v,m) {
    return new Vector2(v.x, v.y).addScalar(m)
  }
  static subScalar(v,m) {
    return new Vector2(v.x, v.y).subScalar(m)
  }
  static multiplyScalar(v,m) {
    return new Vector2(v.x, v.y).multiplyScalar(m)
  }
  static divideScalar(v,m) {
    return new Vector2(v.x, v.y).divideScalar(m)
  }
  static add(v1,v2) {
    return new Vector2(v1.x, v1.y).add(v2)
  }
  static sub(v1,v2) {
    return new Vector2(v1.x, v1.y).sub(v2)
  }
  static dot(v1,v2) {
    return v1.dot(v2)
  }
  static crossZ(v1,v2) {
    return v1.crossZ(v2)
  }
}

/**
* This encapsulate the comportement of DataView and ArrayBuffer for a dynamic
* way to create an ArrayBuffer
*/
export class DataBuffer {
  array: Array<{size:number, type: string, value: number, LittleEndian:boolean}>   = [];
  length: number      = 0;
  MIMEtype: string    = "application/octet-stream";

  constructor() {}

  // This is tricky, it assumes that in the name of the type, you have the
  // number of bits and multiple of 8 (which is true according to the doc)
  static sizeOf(type: string) {
    return (+(type.replace(/\D/g,'')) / 8)
  }

  static formatType(type: string) {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  }

  static parser(arrayBuffer: ArrayBuffer, parsing: Array<{type:string, LittleEndian?: boolean}>) {
    let db = new DataBuffer()
    let s = 0
    for(let p of parsing) {
      p.type = DataBuffer.formatType(p.type)
      let le = p.LittleEndian || false
      db.append(p.type, new DataView(arrayBuffer)["get"+p.type](s, le), le)
      s+=DataBuffer.sizeOf(p.type)
    }
    return db
  }

  append(type, value, LittleEndian = false) {
    type = DataBuffer.formatType(type)
    let s = DataBuffer.sizeOf(type)
    this.array.push({size:s,type:type, value:value, LittleEndian:LittleEndian})
    this.length += s
    return this;
  }

  buffer() {
    let buffer = new ArrayBuffer(this.length)
    let start = 0
    for(let set of this.array) {
      new DataView(buffer)["set"+set.type](start, set.value, set.LittleEndian)
      start += set.size
    }
    return buffer
  }

  toBlob() {
    let buffer = this.buffer()
    return new Blob([buffer],{type: this.MIMEtype});
  }
}

/**
* Some tools to convert degree, radian and interval of values between them
*/
export class Angle {
  constructor() {}
  static radToDeg(val) {
    return val * 180 / Math.PI
  }
  static degToRad(val) {
    return val * Math.PI / 180
  }
  static numericToRad(val, bits) {
    return val / (1<<bits) * 2 * Math.PI
  }
  static numericToDeg(val, bits) {
    return val / (1<<bits) * 360
  }
}

/**
* Random function, uncategorized
*/
export class Util {
  /**
  * Sanitize string to avoid js injection
  */
  static sanitize(s) {
    return s;
    //return html_sanitize(s, function(url){return url;}, function(id){return id;})
  }

  /**
  * Probably the weirdest tool in the box
  * It converts the url with http(s) protocols in one using ws(s) protocols
  */
  static getAppropriateWsUrl(localhost = false) : string {
    let pcol;
  	let u = document.URL;

  	// What interest us right there is the "s" for security
  	if (u.substring(0, 5) == "https") {
  		pcol = "wss://";
  		u = u.substr(8);
  	} else {
  		pcol = "ws://";
  		if (u.substring(0, 4) == "http")
  			u = u.substr(7);
  	}

  	if (localhost) return "ws://ojabotti.ha.fi:23456/xxx";
  	return pcol + u.split('/')[0] + "/xxx";
  }

  /**
  * Encapsulate a websocket creation to paliate to Gecko 6 - 10
  */
  static createWebSocket(url, protocol) {
    // Gecko 6 to 10 check where WebSocket is defined for another purpose
    if ("MozWebSocket" in window) {
      console.log( "We don't support gecko 6 to 10 (aka firefox old versions)")
        //return new MozWebSocket(url, protocol);
    } else if ("WebSocket" in window) {
        return new WebSocket(url, protocol);
    } else {
      console.error("Websockets not supported by this browser")
    }
  }
}
