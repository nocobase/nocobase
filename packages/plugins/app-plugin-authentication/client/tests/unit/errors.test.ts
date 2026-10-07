import { describe, expect, it } from 'vitest';

import { resolveAuthenticationActionError } from '../../actions/errors.js';
import enUS from '../../locales/en-US.js';
import zhCN from '../../locales/zh-CN.js';

/** What Better Auth's client throws with `{ throw: true }`: a BetterFetchError carrying the JSON body. */
function fetchError(status: number, statusText: string, body: unknown) {
  return Object.assign(new Error(statusText), {
    status,
    statusText,
    error: body,
  });
}

const chinese = (key: string, defaultValue: string) =>
  (zhCN.errors as Record<string, string>)[key] ?? defaultValue;

describe('resolveAuthenticationActionError', () => {
  it('returns nothing without an error', () => {
    expect(resolveAuthenticationActionError(undefined)).toBeUndefined();
  });

  it.each([
    ['INVALID_EMAIL_OR_PASSWORD', 401, '邮箱或密码不正确。'],
    ['INVALID_USERNAME_OR_PASSWORD', 401, '用户名或密码不正确。'],
    ['ACCOUNT_DISABLED', 403, '该账号已停用，请联系管理员。'],
    ['USERNAME_IS_ALREADY_TAKEN', 422, '这个用户名已被占用。'],
  ])('localizes the server code %s', (code, status, message) => {
    const error = fetchError(status, 'Unauthorized', {
      code,
      message: 'English from the server',
    });
    expect(resolveAuthenticationActionError(error, chinese)).toEqual({
      code,
      message,
    });
    expect(resolveAuthenticationActionError(error)?.message).toBe(
      (enUS.errors as Record<string, string>)[code],
    );
  });

  it('reports a rate limit, which carries no code', () => {
    const error = fetchError(429, 'Too Many Requests', {
      message: 'Too many requests. Please try again later.',
    });
    expect(resolveAuthenticationActionError(error, chinese)).toEqual({
      code: 'RATE_LIMITED',
      message: '尝试次数过多，请稍后再试。',
    });
  });

  it('reports a request that never reached the server', () => {
    expect(
      resolveAuthenticationActionError(
        new TypeError('Failed to fetch'),
        chinese,
      ),
    ).toEqual({
      code: 'NETWORK_ERROR',
      message: '无法连接服务器，请检查网络后重试。',
    });
  });

  it('falls back to a generic message, never the status text or the server message', () => {
    const unknown = fetchError(500, 'Internal Server Error', {
      code: 'SOMETHING_NEW',
      message: 'Database exploded',
    });
    expect(resolveAuthenticationActionError(unknown, chinese)).toEqual({
      code: 'SOMETHING_NEW',
      message: '出了点问题，请重试。',
    });
    expect(
      resolveAuthenticationActionError(fetchError(401, 'Unauthorized', 'text'))
        ?.message,
    ).toBe(enUS.errors.generic);
  });

  it('has a Chinese message for every English one', () => {
    expect(Object.keys(zhCN.errors).sort()).toEqual(
      Object.keys(enUS.errors).sort(),
    );
  });
});
