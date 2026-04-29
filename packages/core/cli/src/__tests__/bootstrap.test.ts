/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test, expect } from 'vitest';
import {
  formatMissingRuntimeEnvError,
  formatSwaggerSchemaError,
  shouldSkipRuntimeBootstrap,
} from '../lib/bootstrap.js';

test('shouldSkipRuntimeBootstrap skips root help and no-arg invocations', () => {
  expect(shouldSkipRuntimeBootstrap([])).toBe(false);
  expect(shouldSkipRuntimeBootstrap(['--help'])).toBe(false);
  expect(shouldSkipRuntimeBootstrap(['-h'])).toBe(false);
  expect(shouldSkipRuntimeBootstrap(['api'])).toBe(false);
  expect(shouldSkipRuntimeBootstrap(['env', '--help'])).toBe(true);
  expect(shouldSkipRuntimeBootstrap(['resource', 'list'])).toBe(true);
  expect(shouldSkipRuntimeBootstrap(['api', 'resource', 'list'])).toBe(true);
  expect(shouldSkipRuntimeBootstrap(['api', 'resource', 'list', '--help'])).toBe(true);
});

test('shouldSkipRuntimeBootstrap still loads runtime for non-builtin commands', () => {
  expect(shouldSkipRuntimeBootstrap(['users', 'list'])).toBe(false);
  expect(shouldSkipRuntimeBootstrap(['users', 'list', '--json-output'])).toBe(false);
  expect(shouldSkipRuntimeBootstrap(['api', 'users', 'list'])).toBe(false);
});

test('formatSwaggerSchemaError returns actionable guidance for invalid tokens', () => {
  const message = formatSwaggerSchemaError(
    {
      status: 401,
      data: {
        errors: [
          {
            message: 'Your session has expired. Please sign in again.',
            code: 'INVALID_TOKEN',
          },
        ],
      },
    },
    {
      baseUrl: 'http://localhost:13000/api',
      envName: 'local',
      commandToken: 'users',
    },
  );

  expect(message).toMatch(/Authentication failed while loading the command runtime/);
  expect(message).toMatch(/env "local"/);
  expect(message).toMatch(/INVALID_TOKEN/);
  expect(message).toMatch(/env add <name> --api-base-url <url> --auth-type token --token <api-key>/);
  expect(message).toMatch(/nb env update/);
  expect(message).toMatch(/nb --help/);
});

test('formatSwaggerSchemaError returns actionable guidance for missing tokens', () => {
  const message = formatSwaggerSchemaError(
    {
      status: 401,
      data: {
        errors: [
          {
            message: 'Unauthenticated. Please sign in to continue.',
            code: 'EMPTY_TOKEN',
          },
        ],
      },
    },
    {
      baseUrl: 'http://localhost:13000/api',
      envName: 'app1',
    },
  );

  expect(message).toMatch(/Authentication failed while loading the command runtime/);
  expect(message).toMatch(/env "app1"/);
  expect(message).toMatch(/EMPTY_TOKEN/);
  expect(message).toMatch(/nb env auth <name>/);
  expect(message).toMatch(/--token <api-key>/);
});

test('formatSwaggerSchemaError falls back to the raw swagger error for non-auth failures', () => {
  const message = formatSwaggerSchemaError(
    {
      status: 500,
      data: {
        error: {
          message: 'Internal Server Error',
        },
      },
    },
    {
      baseUrl: 'http://localhost:13000/api',
    },
  );

  expect(message).toMatch(/^Failed to load swagger schema from `swagger:get`\./);
  expect(message).toMatch(/Internal Server Error/);
});

test('formatSwaggerSchemaError explains network fetch failures clearly', () => {
  const message = formatSwaggerSchemaError(
    {
      status: 0,
      data: {
        error: {
          message: 'fetch failed',
        },
      },
    },
    {
      baseUrl: 'http://localhost:13000/api',
      commandToken: 'api',
    },
  );

  expect(message).toMatch(/Failed to reach the NocoBase server while loading the command runtime/);
  expect(message).toMatch(/Base URL: http:\/\/localhost:13000\/api/);
  expect(message).toMatch(/Network error: fetch failed/);
  expect(message).toMatch(/nb env add <name> --api-base-url <url>/);
  expect(message).toMatch(/nb env list/);
});

test('formatMissingRuntimeEnvError explains unknown runtime commands without an env', () => {
  const message = formatMissingRuntimeEnvError('not-a-real-command');

  expect(message).toMatch(/Unable to resolve runtime command `not-a-real-command`/);
  expect(message).toMatch(/No env is configured/);
  expect(message).toMatch(/nb --help/);
  expect(message).toMatch(/nb env update/);
});
