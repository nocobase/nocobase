import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatMissingRuntimeEnvError,
  formatSwaggerSchemaError,
  shouldSkipRuntimeBootstrap,
} from '../src/lib/bootstrap.js';

test('shouldSkipRuntimeBootstrap skips root help and no-arg invocations', () => {
  assert.equal(shouldSkipRuntimeBootstrap([]), false);
  assert.equal(shouldSkipRuntimeBootstrap(['--help']), false);
  assert.equal(shouldSkipRuntimeBootstrap(['-h']), false);
  assert.equal(shouldSkipRuntimeBootstrap(['api']), false);
  assert.equal(shouldSkipRuntimeBootstrap(['env', '--help']), true);
  assert.equal(shouldSkipRuntimeBootstrap(['resource', 'list']), true);
});

test('shouldSkipRuntimeBootstrap still loads runtime for non-builtin commands', () => {
  assert.equal(shouldSkipRuntimeBootstrap(['users', 'list']), false);
  assert.equal(shouldSkipRuntimeBootstrap(['users', 'list', '--json-output']), false);
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

  assert.match(message, /Authentication failed while loading the command runtime/);
  assert.match(message, /env "local"/);
  assert.match(message, /INVALID_TOKEN/);
  assert.match(message, /env add --name <name> --base-url <url> --token <api-key>/);
  assert.match(message, /nb env update/);
  assert.match(message, /nb --help/);
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

  assert.match(message, /^Failed to load swagger schema from `swagger:get`\./);
  assert.match(message, /Internal Server Error/);
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

  assert.match(message, /Failed to reach the NocoBase server while loading the command runtime/);
  assert.match(message, /Base URL: http:\/\/localhost:13000\/api/);
  assert.match(message, /Network error: fetch failed/);
  assert.match(message, /nb env add --name <name> --base-url <url>/);
  assert.match(message, /nb env list/);
});

test('formatMissingRuntimeEnvError explains unknown runtime commands without an env', () => {
  const message = formatMissingRuntimeEnvError('not-a-real-command');

  assert.match(message, /Unable to resolve runtime command `not-a-real-command`/);
  assert.match(message, /No env is configured/);
  assert.match(message, /nb --help/);
  assert.match(message, /nb env update/);
});
