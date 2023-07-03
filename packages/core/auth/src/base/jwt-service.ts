import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenBlacklistService } from './token-blacklist-service';

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

  public blacklist: TokenBlacklistService;

  private expiresIn() {
    return this.options.expiresIn;
  }

  private secret() {
    return this.options.secret;
  }

  sign(payload: SignPayload, options?: SignOptions) {
    return jwt.sign(payload, this.secret(), { expiresIn: this.expiresIn(), ...options });
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
    const { exp } = await this.decode(token);

    return this.blacklist.set({
      token,
      expiration: new Date(exp * 1000).toString(),
    });
  }
}
