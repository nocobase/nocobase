interface TLSOptions {
  key?: string;
  cert?: string;
  ca?: string;
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
}

export interface LDAPOption {
  username: string;
  password: string;
  ldapUrl: string;
  baseDN: string;
  reconnect?: boolean;
  connectTimeout?: number;
  tlsOptions?: TLSOptions;
}
