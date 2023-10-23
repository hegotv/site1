export class User {
  email: string;
  username: string;
  token: string;

  constructor(email: string, token: string) {
    this.email = email;
    this.token = token;
  }
}
