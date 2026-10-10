import { renderAnswer } from '../../../../app/app-cli-client/src/dynamic/output.ts';
import type { CliCommand } from '../../../../app/app-cli-client/src/dynamic/manifest.ts';
import { describe, expect, it } from 'vitest';

import { membersListMessage } from '../../shared/access.js';

const command: CliCommand = {
  id: 'access.member.list',
  summary: 'List members',
  method: 'GET',
  path: '/api/access/members',
  parameters: [],
  output: { kind: 'list', columns: ['userId', 'name', 'email', 'roles'] },
  identities: ['person', 'run'],
};

describe('the member list CLI output', () => {
  it('explains the excluded administrator when the only account is an administrator', () => {
    const output = renderAnswer(command, {
      data: [],
      meta: {
        total: 0,
        systemAdministratorCount: 1,
        message: membersListMessage(1),
      },
    });

    expect(output).toBe(
      '1 system administrator holds every permission and is not listed.\n(none)',
    );
  });

  it('shows the excluded administrator count alongside regular members', () => {
    const output = renderAnswer(command, {
      data: [
        {
          userId: 'alice',
          name: 'Alice',
          email: 'alice@example.com',
          roles: [],
        },
      ],
      meta: {
        total: 1,
        systemAdministratorCount: 2,
        message: membersListMessage(2),
      },
    });

    expect(output).toBe(
      '2 system administrators hold every permission and are not listed.\nUSERID  NAME   EMAIL              ROLES\nalice   Alice  alice@example.com  []',
    );
  });
});
