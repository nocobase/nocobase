import jwt, { SignOptions } from 'jsonwebtoken';
import { ITokenBlacklistService } from './token-blacklist-service';

export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type SignPayload = Parameters<typeof jwt.sign>[0];

export class JwtService {
  constructor(
    protected options: JwtOptions = {
      secret: process.env.APP_KEY,
    },
  ) {
    const { secret, expiresIn } = options;
    this.options = {
      secret: secret,
      expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d',
    };
  }

  public blacklist: ITokenBlacklistService;

  private expiresIn() {
    return this.options.expiresIn;
  }

  private secret() {
    return this.options.secret;
  }

  sign(payload: SignPayload, options?: SignOptions) {
    const opt = { expiresIn: this.expiresIn(), ...options };
    if (opt.expiresIn === 'never') {
      opt.expiresIn = '1000y';
    }
    return jwt.sign(payload, this.secret(), opt);
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

  /**
   * @description Block a token so that this token can no longer be used
   */
  async block(token: string) {
    if (!this.blacklist) {
      return null;
    }
    try {
      const { exp } = await this.decode(token);
      return this.blacklist.add({
        token,
        expiration: new Date(exp * 1000).toString(),
      });
    } catch {
      return null;
    }
  }
}
