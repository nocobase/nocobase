/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isDomainMatch } from '../utils';

const wrapKeyData: (domain: string) => any = (domain: string) => ({
  licenseKey: { domain },
});

describe('isDomainMatch - full domain format coverage', () => {
  // ========== 普通域名 ==========
  test('matches normal domain nocobase.com', () => {
    return expect(isDomainMatch('https://nocobase.com', wrapKeyData('nocobase.com'))).toBe(true);
  });

  test('matches subdomain sub.nocobase.com', () => {
    expect(isDomainMatch('https://sub.nocobase.com', wrapKeyData('sub.nocobase.com'))).toBe(true);
  });

  test('fails subdomain if not equal', () => {
    expect(isDomainMatch('https://sub.nocobase.com', wrapKeyData('nocobase.com'))).toBe(false);
  });

  // ========== 带端口 ==========
  test('matches domain with port nocobase.com:13000', () => {
    expect(isDomainMatch('https://nocobase.com:13000', wrapKeyData('nocobase.com:13000'))).toBe(true);
  });

  test('fails if port not equal', () => {
    expect(isDomainMatch('https://nocobase.com:13001', wrapKeyData('nocobase.com:13000'))).toBe(false);
  });

  // ========== 泛域名 ==========
  test('matches wildcard *.nocobase.com', () => {
    expect(isDomainMatch('https://sub.nocobase.com', wrapKeyData('*.nocobase.com'))).toBe(true);
  });

  test('matches wildcard *.sub.nocobase.com', () => {
    expect(isDomainMatch('https://x.sub.nocobase.com', wrapKeyData('*.sub.nocobase.com'))).toBe(true);
  });

  test('wildcard fails when no base domain match', () => {
    expect(isDomainMatch('https://abc.com', wrapKeyData('*.nocobase.com'))).toBe(false);
  });

  // ========== 泛域名 + 端口 ==========
  test('matches wildcard with port *.nocobase.com:13000', () => {
    expect(isDomainMatch('https://sub.nocobase.com:13000', wrapKeyData('*.nocobase.com:13000'))).toBe(true);
  });

  test('fails wildcard when port mismatch', () => {
    expect(isDomainMatch('https://sub.nocobase.com:13001', wrapKeyData('*.nocobase.com:13000'))).toBe(false);
  });

  // ========== IPv4 ==========
  test('matches IPv4 with port 127.0.0.1:13000', () => {
    expect(isDomainMatch('http://127.0.0.1:13000', wrapKeyData('127.0.0.1:13000'))).toBe(true);
  });

  test('fails IPv4 if port mismatch', () => {
    expect(isDomainMatch('http://127.0.0.1:13001', wrapKeyData('127.0.0.1:13000'))).toBe(false);
  });

  // ========== IPv6 ==========
  test('matches IPv6 format [::1]:13000', () => {
    expect(isDomainMatch('http://[::1]:13000', wrapKeyData('[::1]:13000'))).toBe(true);
  });

  test('fails IPv6 when port mismatch', () => {
    expect(isDomainMatch('http://[::1]:13001', wrapKeyData('[::1]:13000'))).toBe(false);
  });

  // ========== 多个域名（逗号分隔） ==========
  test('matches one of multiple domains', () => {
    expect(isDomainMatch('https://nocobase2.com', wrapKeyData('nocobase1.com,nocobase2.com'))).toBe(true);
  });

  test('fails if none match in multiple domains', () => {
    expect(isDomainMatch('https://notmatched.com', wrapKeyData('nocobase1.com,nocobase2.com'))).toBe(false);
  });

  // ========== 空值 ==========
  test('returns false if currentDomain empty', () => {
    expect(isDomainMatch('', wrapKeyData('nocobase.com'))).toBe(false);
  });

  test('returns false if license domain empty', () => {
    expect(isDomainMatch('https://nocobase.com', wrapKeyData(''))).toBe(false);
  });

  test('returns false if keyData null', () => {
    expect(isDomainMatch('https://nocobase.com', null as any)).toBe(false);
  });
});
