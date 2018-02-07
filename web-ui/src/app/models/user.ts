export enum UserRole {
  STANDARD = 0,
  ADMIN = 1
}

export class User {

  constructor(public name: string, public role: UserRole = UserRole.STANDARD) {

  }
}
