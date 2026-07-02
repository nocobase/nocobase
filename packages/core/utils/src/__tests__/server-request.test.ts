/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import axios from 'axios';
import { lookup } from 'dns/promises';
import { vi } from 'vitest';

import { checkUrlAgainstWhitelist, matchesDomainPattern, serverRequest } from '../server-request';

vi.mock('axios', () => ({
  default: {
    request: vi.fn(async () => ({ data: {}, headers: {}, status: 200 })),
  },
}));

vi.mock('dns/promises', () => ({
  lookup: vi.fn(),
}));

// IP/CIDR matching is delegated to ipaddr.js (a mature, well-tested library).
// We only verify that our integration with it works correctly via
// checkUrlAgainstWhitelist end-to-end tests.

describe('matchesDomainPattern', () => {
  it('exact domain match (case-insensitive)', () => {
    expect(matchesDomainPattern('api.example.com', 'api.example.com')).toBe(true);
    expect(matchesDomainPattern('API.EXAMPLE.COM', 'api.example.com')).toBe(true);
    expect(matchesDomainPattern('other.example.com', 'api.example.com')).toBe(false);
  });

  it('wildcard matches exactly one subdomain level', () => {
    expect(matchesDomainPattern('foo.example.com', '*.example.com')).toBe(true);
    expect(matchesDomainPattern('bar.baz.example.com', '*.example.com')).toBe(false);
    expect(matchesDomainPattern('example.com', '*.example.com')).toBe(false);
  });
});

describe('checkUrlAgainstWhitelist', () => {
  const ENV_KEY = 'SERVER_REQUEST_WHITELIST';
  let original: string | undefined;

  beforeEach(() => {
    original = process.env[ENV_KEY];
    delete process.env[ENV_KEY];
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = original;
    }
  });

  // ── no whitelist ──────────────────────────────────────────────────────────

  it('no whitelist: allows any http/https URL', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(() => checkUrlAgainstWhitelist('http://10.0.0.1/secret')).not.toThrow();
      expect(() => checkUrlAgainstWhitelist('https://169.254.169.254/meta-data/')).not.toThrow();
      expect(() => checkUrlAgainstWhitelist('http://[::1]/admin')).not.toThrow();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('no whitelist: warns when allowing SSRF risk targets', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(() => checkUrlAgainstWhitelist('http://127.0.0.2/admin')).not.toThrow();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/potential SSRF risk target/i);
      expect(warnSpy.mock.calls[0][0]).toContain('SERVER_REQUEST_WHITELIST is not configured');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('no whitelist: does not warn for public targets', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(() => checkUrlAgainstWhitelist('https://8.8.8.8/dns-query')).not.toThrow();
      expect(() => checkUrlAgainstWhitelist('https://api.example.com/v1')).not.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('no whitelist: warns once per SSRF risk target', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(() => checkUrlAgainstWhitelist('http://192.168.10.20/admin')).not.toThrow();
      expect(() => checkUrlAgainstWhitelist('http://192.168.10.20/health')).not.toThrow();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('whitelist set: does not warn for explicitly allowed SSRF risk targets', () => {
    process.env[ENV_KEY] = '127.0.0.3';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(() => checkUrlAgainstWhitelist('http://127.0.0.3/admin')).not.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('always blocks non-http/https schemes regardless of whitelist', () => {
    expect(() => checkUrlAgainstWhitelist('file:///etc/passwd')).toThrow(/scheme.*file.*not allowed/i);
    expect(() => checkUrlAgainstWhitelist('ftp://files.example.com/data')).toThrow(/scheme.*ftp.*not allowed/i);
  });

  it('allows relative URLs (same-server calls)', () => {
    expect(() => checkUrlAgainstWhitelist('/api/users:list')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist(undefined as any)).not.toThrow();
  });

  // ── IPv4 ──────────────────────────────────────────────────────────────────

  it('whitelist: allows exact IPv4', () => {
    process.env[ENV_KEY] = '1.2.3.4';
    expect(() => checkUrlAgainstWhitelist('http://1.2.3.4/api')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('http://1.2.3.5/api')).toThrow(/blocked/i);
  });

  it('whitelist: allows IPv4 in CIDR range', () => {
    process.env[ENV_KEY] = '10.0.0.0/8';
    expect(() => checkUrlAgainstWhitelist('http://10.20.30.40/api')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('http://11.0.0.1/api')).toThrow(/blocked/i);
  });

  it('whitelist: blocks AWS metadata endpoint', () => {
    process.env[ENV_KEY] = 'api.example.com';
    expect(() => checkUrlAgainstWhitelist('http://169.254.169.254/latest/meta-data/')).toThrow(/blocked/i);
  });

  it('whitelist: blocks loopback 127.x', () => {
    process.env[ENV_KEY] = 'api.example.com';
    expect(() => checkUrlAgainstWhitelist('http://127.0.0.1:8080/admin')).toThrow(/blocked/i);
  });

  // ── IPv6 ──────────────────────────────────────────────────────────────────

  it('whitelist: allows exact IPv6', () => {
    process.env[ENV_KEY] = '2001:db8::1';
    expect(() => checkUrlAgainstWhitelist('http://[2001:db8::1]/api')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('http://[2001:db8::2]/api')).toThrow(/blocked/i);
  });

  it('whitelist: allows IPv6 in CIDR range', () => {
    process.env[ENV_KEY] = '2001:db8::/32';
    expect(() => checkUrlAgainstWhitelist('http://[2001:db8::1]/api')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('http://[2001:db9::1]/api')).toThrow(/blocked/i);
  });

  it('whitelist: blocks IPv6 loopback ::1', () => {
    process.env[ENV_KEY] = 'api.example.com';
    expect(() => checkUrlAgainstWhitelist('http://[::1]/admin')).toThrow(/blocked/i);
  });

  it('no whitelist: IPv6 loopback allowed (backward compat)', () => {
    delete process.env[ENV_KEY];
    expect(() => checkUrlAgainstWhitelist('http://[::1]/admin')).not.toThrow();
  });

  it('whitelist: IPv4-mapped IPv6 matches IPv4 CIDR entry', () => {
    // ::ffff:10.0.0.1 should match a "10.0.0.0/8" entry
    process.env[ENV_KEY] = '10.0.0.0/8';
    expect(() => checkUrlAgainstWhitelist('http://[::ffff:a00:1]/api')).not.toThrow();
  });

  it('whitelist: allows IPv6 unique-local range', () => {
    process.env[ENV_KEY] = 'fc00::/7';
    expect(() => checkUrlAgainstWhitelist('http://[fd00::1]/api')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('http://[fe80::1]/api')).toThrow(/blocked/i);
  });

  // ── domain / wildcard ─────────────────────────────────────────────────────

  it('whitelist: allows exact domain', () => {
    process.env[ENV_KEY] = 'api.example.com';
    expect(() => checkUrlAgainstWhitelist('https://api.example.com/v1')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('https://evil.example.com/v1')).toThrow(/blocked/i);
  });

  it('whitelist: wildcard allows one subdomain level only', () => {
    process.env[ENV_KEY] = '*.trusted.com';
    expect(() => checkUrlAgainstWhitelist('https://service.trusted.com/v1')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('https://trusted.com/v1')).toThrow(/blocked/i);
    expect(() => checkUrlAgainstWhitelist('https://a.b.trusted.com/v1')).toThrow(/blocked/i);
  });

  // ── multi-entry & edge cases ──────────────────────────────────────────────

  it('whitelist: multi-entry — allows when any entry matches', () => {
    process.env[ENV_KEY] = '1.2.3.4,api.example.com,*.trusted.com';
    expect(() => checkUrlAgainstWhitelist('http://1.2.3.4/api')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('https://api.example.com/v1')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('https://foo.trusted.com/v1')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('http://10.0.0.1/secret')).toThrow(/blocked/i);
  });

  it('whitelist: ignores blank entries and surrounding whitespace', () => {
    process.env[ENV_KEY] = ' , ,api.example.com, ';
    expect(() => checkUrlAgainstWhitelist('https://api.example.com/v1')).not.toThrow();
    expect(() => checkUrlAgainstWhitelist('https://other.com/v1')).toThrow(/blocked/i);
  });

  it('whitelist: scheme check still applies even when host would match', () => {
    process.env[ENV_KEY] = '1.2.3.4';
    expect(() => checkUrlAgainstWhitelist('file:///etc/passwd')).toThrow(/scheme.*file.*not allowed/i);
  });

  it('whitelist: relative URLs always allowed regardless of whitelist', () => {
    process.env[ENV_KEY] = 'api.example.com';
    expect(() => checkUrlAgainstWhitelist('/api/users:list')).not.toThrow();
  });
});

describe('serverRequest SSRF risk warnings', () => {
  const ENV_KEY = 'SERVER_REQUEST_WHITELIST';
  let original: string | undefined;

  beforeEach(() => {
    original = process.env[ENV_KEY];
    delete process.env[ENV_KEY];
    vi.mocked(axios.request).mockClear();
    vi.mocked(lookup).mockReset();
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = original;
    }
  });

  it('no whitelist: warns when a hostname resolves to an SSRF risk address', async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      await expect(serverRequest({ url: 'http://internal.example.com/api', method: 'GET' })).resolves.toMatchObject({
        status: 200,
      });

      expect(lookup).toHaveBeenCalledWith('internal.example.com', { all: true, verbatim: true });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('internal.example.com');
      expect(warnSpy.mock.calls[0][0]).toContain('resolves to 127.0.0.1');
      expect(axios.request).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('whitelist set: does not resolve hostnames for warning checks', async () => {
    process.env[ENV_KEY] = 'internal.example.com';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      await expect(serverRequest({ url: 'http://internal.example.com/api', method: 'GET' })).resolves.toMatchObject({
        status: 200,
      });

      expect(lookup).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(axios.request).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
