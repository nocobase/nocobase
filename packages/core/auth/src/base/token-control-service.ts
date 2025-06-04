/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface TokenPolicyConfig {
  tokenExpirationTime: string;
  sessionExpirationTime: string;
  expiredTokenRenewLimit: string;
}

type millisecond = number;
export type NumericTokenPolicyConfig = {
  [K in keyof TokenPolicyConfig]: millisecond;
};

export type TokenInfo = {
  jti: string;
  userId: number;
  issuedTime: EpochTimeStamp;
  signInTime: EpochTimeStamp;
  renewed: boolean;
};

export type JTIStatus = 'valid' | 'inactive' | 'blocked' | 'missing' | 'renewed' | 'expired';
export interface ITokenControlService {
  getConfig(): Promise<NumericTokenPolicyConfig>;
  setConfig(config: TokenPolicyConfig): Promise<any>;
  renew(jti: string): Promise<{ jti: string; issuedTime: EpochTimeStamp }>;
  add({ userId }: { userId: number }): Promise<TokenInfo>;
  removeSessionExpiredTokens(userId: number): Promise<any>;
}
