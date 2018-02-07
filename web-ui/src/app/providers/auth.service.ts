import { Injectable } from '@angular/core';

import { User, UserRole }     from "../models/user";
export { User,UserRole } from "../models/user";

const testlogin = {
  name: "admin",
  pass: "pass"
}

@Injectable()
export class AuthService {

  user: User = null;

  constructor() {
    let log = JSON.parse(sessionStorage.getItem("log"))
    if(log)
      this.login(log.name, log.pass)
  }

  logged(): boolean {
    return !!this.user
  }

  login(name: string, pass: string) {
    if(!name || !pass)  return
    let u = new User(name)
    if(name == testlogin.name && pass == testlogin.pass) {
      u.role = UserRole.ADMIN
    }
    this.user = u
    sessionStorage.setItem("log",JSON.stringify({name:name, pass:pass}))
  }
}
