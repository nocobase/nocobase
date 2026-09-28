import { describe, expect, it } from 'vitest';
import {
  unsupportedNodeVersionEnvelope,
  unsupportedNodeVersionOutput,
} from '@nocobase/cli-envelope/node-guard';
import { failureEnvelope, successEnvelope } from '../src/lib/output.ts';

/**
 * The `--json` envelope is a contract agents parse, so every member is pinned here, in the order it is printed. It is
 * also the application CLI's envelope; `tests/scripts/json-envelope-parity.test.mjs` at the repository root compares
 * the two, and a change here has to be made there too.
 */
describe('the --json envelope', () => {
  it('reports a success, and a dry run as success-noop', () => {
    expect(
      JSON.stringify(successEnvelope({ mode: 'dry-run' }, 'success-noop')),
    ).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: true,
        command: 'create-plugin',
        status: 'success-noop',
        result: { mode: 'dry-run' },
        warnings: [],
      }),
    );
    expect(successEnvelope(undefined)).toStrictEqual({
      schemaVersion: 1,
      ok: true,
      command: 'create-plugin',
      status: 'success',
      result: null,
      warnings: [],
    });
  });

  it('reports a failure as `failure`, with each suggestion as an object', () => {
    expect(
      JSON.stringify(
        failureEnvelope({
          code: 'TARGET_ALREADY_EXISTS',
          message:
            'Target already exists: packages/plugins/app-plugin-audit-log',
          suggestions: [
            {
              message:
                'Choose another plugin name or inspect the existing package.',
            },
          ],
        }),
      ),
    ).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: false,
        command: 'create-plugin',
        status: 'failure',
        error: {
          code: 'TARGET_ALREADY_EXISTS',
          message:
            'Target already exists: packages/plugins/app-plugin-audit-log',
          suggestions: [
            {
              message:
                'Choose another plugin name or inspect the existing package.',
            },
          ],
        },
        warnings: [],
      }),
    );
  });

  it('answers an unsupported Node.js in the same shape, on stdout only under --json', () => {
    expect(
      JSON.stringify(
        unsupportedNodeVersionEnvelope('create-plugin', 'v22.0.0'),
      ),
    ).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: false,
        command: 'create-plugin',
        status: 'failure',
        error: {
          code: 'NODE_UNSUPPORTED',
          message:
            'Node.js 24 or later is required; the current version is v22.0.0.',
          suggestions: [
            {
              message:
                'Install Node.js 24 or later, then run the command again.',
            },
          ],
        },
        warnings: [],
      }),
    );
    const guard = {
      name: 'create-plugin',
      command: 'create-plugin',
      version: 'v22.0.0',
      indent: 2,
    };
    expect(
      unsupportedNodeVersionOutput({ ...guard, argv: ['audit-log', '--json'] }),
    ).toEqual({
      stream: 'stdout',
      text: JSON.stringify(
        unsupportedNodeVersionEnvelope('create-plugin', 'v22.0.0'),
        null,
        2,
      ),
    });
    expect(
      unsupportedNodeVersionOutput({ ...guard, argv: ['audit-log'] }),
    ).toMatchObject({
      stream: 'stderr',
      text: expect.stringContaining('Node.js 24 or later is required'),
    });
  });
});
