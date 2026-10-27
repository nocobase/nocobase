import {
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest, type TestApp } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

export const test = createAppTest({ createServer: createStandaloneServer });

export async function registerReader(
  app: TestApp,
  name: string,
): Promise<TestSession> {
  const credentials = {
    email: `${name}@example.com`,
    password: 'reading-list-test-password',
  };
  const response = await app.request('/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ ...credentials, name }),
  });
  expect(response.status).toBe(200);
  return signIn(app, credentials);
}
