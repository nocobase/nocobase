export interface TokenBlacklistService {
  has(token: string): Promise<boolean>;
  add(values: { token: string; expiration: string | Date }): Promise<any>;
}
