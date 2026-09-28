import { describe, expect, it } from 'vitest';
import {
  COMMAND_JSON_SCHEMA_VERSION,
  commandFailureJson,
  commandSuccessJson,
  formatCommandLine,
  isCommandEnvelope,
  quoteForShell,
  renderSuggestion,
} from '../src/index.ts';

/** The envelope is a contract agents parse, so every member is pinned here, in the order it is printed. */
describe('commandSuccessJson', () => {
  it('prints the members in the documented order, with the result and warnings', () => {
    expect(
      JSON.stringify(
        commandSuccessJson('db apply', 'success', { applied: 2 }, ['slow']),
      ),
    ).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: true,
        command: 'db apply',
        status: 'success',
        result: { applied: 2 },
        warnings: ['slow'],
      }),
    );
  });

  it('reports nothing produced as `result: null`', () => {
    expect(
      commandSuccessJson('status', 'success-noop', undefined, []).result,
    ).toBeNull();
  });

  it('copies the warnings rather than keeping the caller’s array', () => {
    const warnings = ['one'];
    const envelope = commandSuccessJson('status', 'success', null, warnings);
    warnings.push('two');
    expect(envelope.warnings).toEqual(['one']);
  });
});

describe('commandFailureJson', () => {
  const error = {
    code: 'PORT_IN_USE',
    message: 'Port 13000 is already in use.',
    suggestions: [
      {
        message: 'See what holds it:',
        run: { command: 'lsof', args: ['-i', ':13000'] },
      },
      { message: 'Or choose another port with --port.' },
    ],
  };

  it('prints the members in the documented order, details included where given', () => {
    expect(
      JSON.stringify(
        commandFailureJson('dev', { ...error, details: { freePort: 13001 } }, [
          'a warning',
        ]),
      ),
    ).toBe(
      JSON.stringify({
        schemaVersion: 1,
        ok: false,
        command: 'dev',
        status: 'failure',
        error: { ...error, details: { freePort: 13001 } },
        warnings: ['a warning'],
      }),
    );
  });

  it('leaves `details` out when there are none, so a reader can test for it', () => {
    const envelope = commandFailureJson('dev', error, []);
    expect('details' in envelope.error).toBe(false);
    expect(
      'details' in
        commandFailureJson('dev', { ...error, details: undefined }, []).error,
    ).toBe(false);
    expect(
      commandFailureJson('dev', { ...error, details: null }, []).error.details,
    ).toBeNull();
  });
});

describe('isCommandEnvelope', () => {
  it('recognises what the builders return and nothing else', () => {
    expect(isCommandEnvelope(commandSuccessJson('x', 'success', 1, []))).toBe(
      true,
    );
    expect(
      isCommandEnvelope(
        commandFailureJson(
          'x',
          { code: 'A', message: 'b', suggestions: [] },
          [],
        ),
      ),
    ).toBe(true);
    expect(
      isCommandEnvelope({
        schemaVersion: COMMAND_JSON_SCHEMA_VERSION,
        ok: true,
        command: 'x',
        status: 'success',
        result: 1,
        warnings: [],
      }),
    ).toBe(false);
    expect(isCommandEnvelope(null)).toBe(false);
  });

  it('survives JSON round-tripping as data only, since the brand is a symbol', () => {
    const envelope = commandSuccessJson('x', 'success', 1, []);
    expect(JSON.parse(JSON.stringify(envelope))).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'x',
      status: 'success',
      result: 1,
      warnings: [],
    });
  });
});

describe('a suggestion for a person', () => {
  it('quotes only the arguments a shell would split or interpret', () => {
    expect(quoteForShell('/srv/hub')).toBe('/srv/hub');
    expect(quoteForShell('--registry=https://npm.nocobase.ai/')).toBe(
      '--registry=https://npm.nocobase.ai/',
    );
    expect(quoteForShell("/srv/it's here")).toBe("'/srv/it'\\''s here'");
    expect(
      formatCommandLine({
        command: 'tail',
        args: ['-n', '100', '/srv/my hub/logs/error.log'],
      }),
    ).toBe("tail -n 100 '/srv/my hub/logs/error.log'");
  });

  it('renders the message alone, or followed by the command line', () => {
    expect(renderSuggestion({ message: 'Fix it.' })).toBe('Fix it.');
    expect(
      renderSuggestion({
        message: 'Start it:',
        run: { command: 'pm2', args: ['start', 'ecosystem.config.cjs'] },
      }),
    ).toBe('Start it: pm2 start ecosystem.config.cjs');
  });
});
