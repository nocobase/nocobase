export enum IDTOKEN_SIGN_ALG {
  HS256 = 'HS256',
  RS256 = 'RS256',
}

export interface OIDCProvider {
  providerName?: string;
  clientId?: string;
  clientSecret?: string;
  issuer?: string;
  openidConfiguration?: string;
  authorizeUrl?: string;
  tokenUrl?: string;
  revodeUrl?: string;
  jwksUrl?: string;
  userinfoUrl?: string;
  enable?: string;
  redirectUrl?: string;
  logoutUrl?: string;
  idTokenSignAlg?: string;
  attrsMap?: Record<string, string>;
}
