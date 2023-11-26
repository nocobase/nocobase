import path from 'path';

import { MockServer } from '@nocobase/test';

export { sleep } from '../testkit';

import { getApp as defaultGetApp } from '../testkit';

export async function getApp(options = {}): Promise<MockServer> {
  return defaultGetApp({
    collectionPath: path.resolve(__dirname, './collections'),
    ...options,
  });
}
