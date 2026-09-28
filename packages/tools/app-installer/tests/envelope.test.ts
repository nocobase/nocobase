import { describe, expect, it } from 'vitest';
import { unsupportedNodeVersionEnvelope } from '@nocobase/cli-envelope/node-guard';
import { EXIT_INVALID, InstallerError } from '../src/lib/errors.ts';
import {
  errorEnvelope,
  formatError,
  successEnvelope,
} from '../src/lib/output.ts';

/**
 * The `--json` envelope is a contract scripts and agents parse, so every member is pinned here, in the order it is
 * printed. It is also the application CLI's envelope; `tests/scripts/json-envelope-parity.test.mjs` at the repository
 * root compares the two, and a change here has to be made there too.
 */
describe('the --json envelope', () => {
  it('reports a success with its status, result and warnings', () => {
    const envelope = successEnvelope(
      'status',
      { current: '1.0.0' },
      ['pm2 could not be queried; process state is unknown.'],
      'success-noop',
    );
    expect(JSON.stringify(envelope)).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: true,
        command: 'status',
        status: 'success-noop',
        result: { current: '1.0.0' },
        warnings: ['pm2 could not be queried; process state is unknown.'],
      }),
    );
  });

  it('reports a result of nothing as null rather than leaving it out', () => {
    expect(successEnvelope('status', undefined, [])).toStrictEqual({
      schemaVersion: 1,
      ok: true,
      command: 'status',
      status: 'success',
      result: null,
      warnings: [],
    });
  });

  it("reports a failure as `failure`, with each suggestion's command as an executable and its arguments", () => {
    const error = new InstallerError(
      'PORT_IN_USE',
      'Port 13000 is already in use.',
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message: 'See what holds it:',
            run: { command: 'lsof', args: ['-i', ':13000'] },
          },
          { message: 'Or choose another port with --port.' },
        ],
        details: { freePort: 13001 },
      },
    );
    expect(JSON.stringify(errorEnvelope('install', error, ['a warning']))).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: false,
        command: 'install',
        status: 'failure',
        error: {
          code: 'PORT_IN_USE',
          message: 'Port 13000 is already in use.',
          suggestions: [
            {
              message: 'See what holds it:',
              run: { command: 'lsof', args: ['-i', ':13000'] },
            },
            { message: 'Or choose another port with --port.' },
          ],
          details: { freePort: 13001 },
        },
        warnings: ['a warning'],
      }),
    );
  });

  it('leaves `details` out of a failure that has none', () => {
    const envelope = errorEnvelope(
      'status',
      new InstallerError('NOT_INSTALLED', 'Nothing is installed here.'),
      [],
    );
    expect(envelope).toStrictEqual({
      schemaVersion: 1,
      ok: false,
      command: 'status',
      status: 'failure',
      error: {
        code: 'NOT_INSTALLED',
        message: 'Nothing is installed here.',
        suggestions: [],
      },
      warnings: [],
    });
  });

  it('reports anything else thrown as UNEXPECTED', () => {
    expect(
      errorEnvelope('status', new Error('Something broke.'), []),
    ).toStrictEqual({
      schemaVersion: 1,
      ok: false,
      command: 'status',
      status: 'failure',
      error: {
        code: 'UNEXPECTED',
        message: 'Something broke.',
        suggestions: [],
      },
      warnings: [],
    });
  });

  it("answers an unsupported Node.js in the same shape, since bin/run.js prints it before the CLI's code loads", () => {
    const guard = unsupportedNodeVersionEnvelope('install', 'v22.0.0');
    expect(JSON.stringify(guard)).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: false,
        command: 'install',
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
  });

  it("prints each suggestion's command for a person as one line, quoted where a shell would split it", () => {
    const error = new InstallerError('START_FAILED', 'It did not start.', {
      suggestions: [
        {
          message: 'Read the error log:',
          run: {
            command: 'tail',
            args: ['-n', '100', '/srv/my hub/logs/error.log'],
          },
        },
      ],
    });
    expect(formatError(error)).toBe(
      [
        'Error: It did not start.',
        '  Read the error log:',
        "    tail -n 100 '/srv/my hub/logs/error.log'",
      ].join('\n'),
    );
  });
});
