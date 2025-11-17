export class User {
  email: string;
  username!: string;
  token: string;
  name?: string;
  surname?: string;
  photo?: string;

  constructor(
    email: string,
    token: string,
    name?: string,
    surname?: string,
    photo?: string
  ) {
    this.email = email;
    this.token = token;
    this.name = name;
    this.surname = surname;
    this.photo = photo;
  }
}
