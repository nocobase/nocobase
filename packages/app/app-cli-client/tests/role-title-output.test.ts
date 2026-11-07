import { expect, it } from 'vitest';

import { renderAnswer } from '../src/dynamic/output.ts';
import type { CliCommand } from '../src/dynamic/manifest.ts';

it('prints a localized role title as readable text in a list', () => {
  const command: CliCommand = {
    id: 'access role list',
    summary: 'List the roles',
    method: 'GET',
    path: '/api/access/roles',
    parameters: [],
    output: { kind: 'list', columns: ['key', 'title'] },
    identities: ['person'],
  };

  expect(
    renderAnswer(command, {
      data: [{ key: 'owner', title: '所有者' }],
    }),
  ).toBe('KEY    TITLE\nowner  所有者');
});
