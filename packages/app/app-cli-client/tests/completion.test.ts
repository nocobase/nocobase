import { describe, expect, it } from 'vitest';

import { completeLine, completionScript } from '../src/completion.ts';
import type { CliCommand } from '../src/dynamic/manifest.ts';

const command = (
  id: string,
  parameters: CliCommand['parameters'] = [],
): CliCommand => ({
  id,
  summary: id,
  method: 'GET',
  path: '/api/x',
  parameters,
  output: { kind: 'data' },
  identities: ['person'],
});

const commands = [
  command('issue:get', [
    {
      name: 'issue',
      field: 'issueId',
      in: 'path',
      position: 0,
      type: 'string',
      required: true,
    },
  ]),
  command('issue:comment:add', [
    {
      name: 'content',
      field: 'content',
      in: 'body',
      type: 'string',
      required: true,
      contentFile: true,
    },
    {
      name: 'kind',
      field: 'kind',
      in: 'body',
      type: 'string',
      required: false,
      enum: ['note', 'question'],
    },
  ]),
];
const statics = new Map([
  ['login', ['--server']],
  ['profile:use', []],
]);

describe('completion', () => {
  it('offers the next word of a command, static or from the manifest', () => {
    expect(completeLine([], '', statics, commands)).toEqual([
      'issue',
      'login',
      'profile',
    ]);
    expect(completeLine(['issue'], 'c', statics, commands)).toEqual([
      'comment',
    ]);
    expect(completeLine(['profile'], '', statics, commands)).toEqual(['use']);
  });

  it("offers a command's flags, and a flag's values", () => {
    expect(
      completeLine(['issue', 'comment', 'add'], '--c', statics, commands),
    ).toEqual(['--content', '--content-file']);
    expect(
      completeLine(
        ['issue', 'comment', 'add', '--kind'],
        'q',
        statics,
        commands,
      ),
    ).toEqual(['question']);
    expect(completeLine(['issue', 'get'], 'PM', statics, commands)).toEqual([]);
    expect(completeLine(['login'], '--s', statics, commands)).toEqual([
      '--server',
    ]);
  });

  it('prints a script per shell that asks the CLI', () => {
    for (const shell of ['zsh', 'bash', 'fish'])
      expect(completionScript('acme', shell)).toContain('acme __complete --');
    expect(() => completionScript('acme', 'tcsh')).toThrow('Not a shell');
  });
});
