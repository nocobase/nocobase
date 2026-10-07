// @vitest-environment node
import { expect, it } from 'vitest';
import client from '../client/index.js';
import server, { FILE_COLUMNS } from '../server/index.js';

it('provides services without owning collections, resource routes, or pages', () => {
  expect(server.serviceProviders).toHaveLength(1);
  expect(server.routes).toEqual([]);
  expect(server.database).toBeUndefined();
  const registration = client();
  expect(registration.serviceProviders).toHaveLength(1);
  expect(registration.routes).toEqual([]);
  expect(Object.keys(registration.locales ?? {})).toEqual(['en-US', 'zh-CN']);
});

it('publishes the file column contract from the Server entry', () => {
  expect(FILE_COLUMNS).toEqual([
    'id',
    'disk',
    'key',
    'filename',
    'ext',
    'mimeType',
    'size',
    'createdAt',
    'updatedAt',
  ]);
});
