import { Cache } from '@nocobase/cache';

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
 * avoid cache key override
 * @param {string} userId
 * @returns {`t${string}`}
 */
const getUserTokenStatusKey = (userId: string): string => {
  return `t${userId}`;
};

/**
 * get token status from cache by userId
 * @param {Cache} cache
 * @param {string} userId
 * @returns {Promise<TokenStatus>}
 */
export const getTokenStatus = async (cache: Cache, userId: string): Promise<TokenStatus> => {
  return cache.get<TokenStatus>(getUserTokenStatusKey(userId));
};

export const setTokenStatus = async (cache: Cache, userId: string, tokenStatus: TokenStatus) => {
  await cache.set(getUserTokenStatusKey(userId), tokenStatus);
};
