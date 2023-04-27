import jwt from 'jsonwebtoken';

export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export class JwtService {
  constructor(protected options: JwtOptions) {
    this.options = options || {
      secret: process.env.APP_KEY,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };
  }

  private expiresIn() {
    return this.options.expiresIn;
  }

  private secret() {
    return this.options.secret;
  }

  sign(payload: any) {
    return jwt.sign(payload, this.secret(), { expiresIn: this.expiresIn() });
  }

  decode(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret(), (err: any, decoded: any) => {
        if (err) {
          return reject(err);
        }

        resolve(decoded);
      });
    });
  }
}
