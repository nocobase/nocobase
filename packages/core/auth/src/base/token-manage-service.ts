/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

interface TokenControlConfig {
  tokenExpirationTime: string;
  maxTokenLifetime: string;
  renewalTokenEnabled: boolean;
  maxInactiveInterval: string;
  opTimeoutControlEnabled: boolean;
}

interface TokenActiveInfo {
  lastActiveTime: EpochTimeStamp;
}

interface TokenStatus {
  valid: boolean;
  invalidType: 'expired' | 'other' | null;
}
export interface ITokenControlService {
  config: TokenControlConfig;
  getTokenActiveInfo(tokenId: string): TokenActiveInfo;
  setTokenActiveInfo(tokenId: string, info: Partial<TokenActiveInfo>): void;
  getConfig(): TokenControlConfig;
  setConfig(config: TokenControlConfig): void;
  isTokenAccessAllowed(tokenId: string): boolean;
}
