import type { IncomingMessage } from 'node:http';
import { expect, it } from 'vitest';
import { RejectedWakeGuard } from '../dist/rejected-wake-guard.js';

const request = (authorization = 'Bearer expired', url = '/a/api/pulse') =>
  ({
    method: 'POST',
    url,
    headers: { authorization },
  }) as IncomingMessage;

it('remembers only rejected background identities and allows revalidation after success or a new revision', () => {
  const guard = new RejectedWakeGuard();
  const req = request();
  guard.record('a-v1', req, 401);
  expect(guard.blocks('a-v1', req)).toBe(true);
  expect(guard.blocks('a-v1', request('Bearer fresh'))).toBe(false);
  expect(guard.blocks('a-v2', req)).toBe(false);
  expect(
    guard.blocks('a-v1', {
      ...req,
      method: 'GET',
      headers: { ...req.headers, 'sec-fetch-mode': 'navigate' },
    } as IncomingMessage),
  ).toBe(false);
  guard.record('a-v1', req, 200);
  expect(guard.blocks('a-v1', req)).toBe(false);
  guard.record('a-v1', req, 403);
  expect(guard.blocks('a-v1', req)).toBe(true);
});

it('bounds retained rejection fingerprints', () => {
  const guard = new RejectedWakeGuard();
  for (let i = 0; i <= 1024; i++)
    guard.record('a-v1', request('Bearer expired', `/a/api/${i}`), 401);
  expect(guard.blocks('a-v1', request('Bearer expired', '/a/api/0'))).toBe(
    false,
  );
  expect(guard.blocks('a-v1', request('Bearer expired', '/a/api/1024'))).toBe(
    true,
  );
});

it('allows corrected cookie-only form submissions to wake an idle App and still guards API-key clients', () => {
  const guard = new RejectedWakeGuard();
  const login = {
    method: 'POST',
    url: '/a/api/auth/sign-in/email',
    headers: { cookie: 'session=test' },
  } as IncomingMessage;
  guard.record('a-v1', login, 401);
  expect(guard.blocks('a-v1', login)).toBe(false);
  guard.record('a-v1', login, 403);
  expect(guard.blocks('a-v1', login)).toBe(false);
  const api = {
    ...login,
    headers: { 'x-api-key': 'test-invalid-key' },
  } as IncomingMessage;
  guard.record('a-v1', api, 401);
  expect(guard.blocks('a-v1', api)).toBe(true);
  expect(
    guard.blocks('a-v1', {
      ...api,
      headers: { 'x-api-key': 'test-fresh-key' },
    } as IncomingMessage),
  ).toBe(false);
});
