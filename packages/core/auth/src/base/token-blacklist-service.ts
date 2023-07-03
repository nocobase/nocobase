export interface TokenBlacklistService {
  has(token: string): Promise<boolean>;
  set(values: { token: string; expiration: string }): Promise<any>;
}
