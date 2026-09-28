import { describe, expect, it } from 'vitest';
import {
  unsupportedNodeVersionEnvelope,
  unsupportedNodeVersionOutput,
} from '@nocobase/cli-envelope/node-guard';
import {
  FAILURE_CODES,
  failureEnvelope,
  successEnvelope,
} from '../src/lib/output.ts';

/**
 * The `--json` envelope is a contract agents parse, so every member is pinned here, in the order it is printed. It is
 * also the application CLI's envelope; `tests/scripts/json-envelope-parity.test.mjs` at the repository root compares
 * the two, and a change here has to be made there too.
 */
describe('the --json envelope', () => {
  it('reports a success with its result and warnings', () => {
    expect(
      JSON.stringify(
        successEnvelope({ directory: '/work/crm' }, [
          'Skills were not synced.',
        ]),
      ),
    ).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: true,
        command: 'create-app',
        status: 'success',
        result: { directory: '/work/crm' },
        warnings: ['Skills were not synced.'],
      }),
    );
  });

  it('reports a failure as `failure`, with its code, suggestions and details', () => {
    expect(
      JSON.stringify(
        failureEnvelope({
          code: FAILURE_CODES.install,
          message: 'installation failed',
          suggestions: [
            {
              message: 'Retry inside the project:',
              run: { command: 'pnpm', args: ['install'] },
            },
          ],
          details: { stage: 'install', projectCreated: true },
        }),
      ),
    ).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: false,
        command: 'create-app',
        status: 'failure',
        error: {
          code: 'INSTALL_FAILED',
          message: 'installation failed',
          suggestions: [
            {
              message: 'Retry inside the project:',
              run: { command: 'pnpm', args: ['install'] },
            },
          ],
          details: { stage: 'install', projectCreated: true },
        },
        warnings: [],
      }),
    );
  });

  it('names one code for each stage a failure can stop at', () => {
    expect(FAILURE_CODES).toStrictEqual({
      input: 'INVALID_USAGE',
      download: 'TEMPLATE_DOWNLOAD_FAILED',
      scaffold: 'SCAFFOLD_FAILED',
      install: 'INSTALL_FAILED',
      verify: 'DRIVER_VERIFICATION_FAILED',
    });
  });

  it('answers an unsupported Node.js in the same shape, on stdout only under --json', () => {
    expect(
      JSON.stringify(unsupportedNodeVersionEnvelope('create-app', 'v22.0.0')),
    ).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: false,
        command: 'create-app',
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
      name: 'create-app',
      command: 'create-app',
      version: 'v22.0.0',
    };
    expect(
      unsupportedNodeVersionOutput({ ...guard, argv: ['crm', '--json'] }),
    ).toEqual({
      stream: 'stdout',
      text: JSON.stringify(
        unsupportedNodeVersionEnvelope('create-app', 'v22.0.0'),
      ),
    });
    expect(
      unsupportedNodeVersionOutput({ ...guard, argv: ['crm'] }),
    ).toMatchObject({
      stream: 'stderr',
      text: expect.stringContaining('Node.js 24 or later is required'),
    });
  });
});
