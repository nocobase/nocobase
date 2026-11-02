import { expect, it } from 'vitest';

import { migratePartitionedCookies } from '../../server/sign-in-cookies.js';

it('leaves ordinary authentication cookies unchanged', () => {
  const cookies = [
    'session=ordinary; Path=/crm; HttpOnly; SameSite=Lax',
    'hint=Partitioned; Path=/',
  ];
  expect(migratePartitionedCookies(cookies)).toEqual(cookies);
});

it('expires the ordinary cookie at exactly the configured scope and preserves the new partitioned cookie', () => {
  const cookie =
    '__Secure-custom.session_token=new=signed; Domain=apps.example.com; Path=/parent/crm; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=3600; Expires=Fri, 01 Jan 2100 00:00:00 GMT';
  expect(migratePartitionedCookies([cookie])).toEqual([
    '__Secure-custom.session_token=; Domain=apps.example.com; Path=/parent/crm; HttpOnly; Secure; SameSite=None; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    cookie,
  ]);
});

it('handles attribute casing, chunked cookies and authentication metadata without changing unrelated cookies', () => {
  const cookies = [
    'custom.session_data.0=first; path=/crm; secure; partitioned; max-age=300',
    'custom.session_data.1=last; Path=/crm; Secure; PARTITIONED; expires=Fri, 01 Jan 2100 00:00:00 GMT',
    'custom.dont_remember=true; Path=/crm; Secure; Partitioned',
    'other=keep; Path=/itam; Secure',
  ];
  const migrated = migratePartitionedCookies(cookies);
  expect(migrated).toHaveLength(7);
  for (let i = 0; i < 3; i++) {
    expect(migrated[i * 2]).toMatch(
      /Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT$/,
    );
    expect(migrated[i * 2]).not.toMatch(/partitioned|2100|300/i);
    expect(migrated[i * 2 + 1]).toBe(cookies[i]);
  }
  expect(migrated[6]).toBe(cookies[3]);
});
