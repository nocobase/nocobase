import { Cache } from '@nocobase/cache';
import { CachingConfig } from 'cache-manager';

export enum TokenStatus {
  /**
   * token in valid date
   * @type {TokenStatus.LOGIN}
   */
  LOGIN = 1,
  /**
   * token not in valid date
   * @type {TokenStatus.LOGOUT}
   */
  LOGOUT = -1,
  /**
   * token's data is not last
   * @type {TokenStatus.EXPIRE}
   */
  EXPIRE = -2,
}

/**
 * get token status from cache by userId
 * @param {Cache} cache
 * @param {string} userId
 * @returns {Promise<TokenStatus>}
 */
export const getTokenStatus = async (cache: Cache, userId: string): Promise<TokenStatus> => {
  return cache.get<TokenStatus>(userId);
};

export const setTokenStatus = async (
  cache: Cache,
  userId: string,
  tokenStatus: TokenStatus,
  options?: CachingConfig,
) => {
  await cache.set(userId, tokenStatus, options);
};
