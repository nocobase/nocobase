import { describe, expect, it } from 'vitest';
import { configureAppCli } from '../src/config.ts';
import { setOriginalArgv, unknownCommandError } from '../src/dynamic/index.ts';
import { renderAnswer } from '../src/dynamic/output.ts';
import { errorJsonOf } from '../src/lib/envelope.ts';
import type { CliCommand, CliManifest } from '../src/parse/manifest.ts';
import { TEST_CLI } from './helpers.ts';

const command: CliCommand = {
  id: 'issue:comment:list',
  summary: 'List comments',
  method: 'GET',
  path: '/comments',
  parameters: [],
  output: { kind: 'list', columns: ['content'] },
  identities: ['person'],
};
const manifest: CliManifest = {
  version: 4,
  etag: 'test',
  identity: { kind: 'person', userId: 'one', displayName: 'One' },
  commands: [command],
  withheld: [
    {
      id: 'issue:comment:delete',
      summary: 'Delete',
      identities: ['person'],
      reason: 'action',
      action: 'delete',
    },
  ],
};

describe('CLI experience', () => {
  it('suggests offered commands for nested and top-level typos in structured errors', () => {
    configureAppCli(TEST_CLI);
    const error = errorJsonOf(
      unknownCommandError(manifest, ['issue', 'comment', 'lsit']),
    );
    expect(error.code).toBe('INVALID_USAGE');
    expect(error.suggestions[0]).toEqual({
      message: 'Did you mean issue comment list?',
      run: { command: 'acme', args: ['issue', 'comment', 'list', '--help'] },
    });
    expect(
      errorJsonOf(unknownCommandError(manifest, ['isssue'])).suggestions[0]?.run
        ?.args,
    ).toEqual(['issue', '--help']);
    expect(
      JSON.stringify(
        errorJsonOf(
          unknownCommandError(manifest, ['issue', 'comment', 'delet']),
        ),
      ),
    ).not.toContain('delete');
    expect(
      errorJsonOf(unknownCommandError(manifest, ['zzzzzz'])).suggestions,
    ).toHaveLength(1);
  });

  it('suggests static commands before signing in', () => {
    configureAppCli(TEST_CLI);
    setOriginalArgv([], ['whoami', 'login']);
    expect(
      errorJsonOf(unknownCommandError({ commands: [] }, ['whoam']))
        .suggestions[0]?.run?.args,
    ).toEqual(['whoami', '--help']);
    setOriginalArgv([]);
  });

  it('adds one hint only when a displayed field was truncated', () => {
    const long = { content: { nested: 'x'.repeat(160) } };
    for (const data of [long, [long, long]]) {
      const output = renderAnswer(command, { data });
      expect(output.match(/Use --json/gu)).toHaveLength(1);
      expect(output).toContain('…');
    }
    for (const data of [
      { content: 'short…' },
      [{ content: 'short' }],
      { content: `https://example.test/${'x'.repeat(200)}` },
    ])
      expect(renderAnswer(command, { data })).not.toContain('Use --json');
  });
});
