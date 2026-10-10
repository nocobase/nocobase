import { describe, expect, it } from 'vitest';

import type { CliCommand } from '../src/dynamic/manifest.ts';
import {
  renderAnswer,
  renderFields,
  renderTable,
} from '../src/dynamic/output.ts';

describe('copyable invitation URLs', () => {
  const inviteUrl = `https://application.example.test/long/public/base/path/invite/${'a'.repeat(43)}`;
  const command: CliCommand = {
    id: 'project:invitation:create',
    summary: 'Invite people',
    method: 'POST',
    path: '/api/projects/invitations',
    parameters: [],
    output: { kind: 'data' },
    identities: ['person', 'run'],
  };

  it.each([1, 3])(
    'renders all nested results and complete links for %i invitees',
    (count) => {
      const results = Array.from({ length: count }, (_, index) => ({
        email: `invitee-${index}@example.test`,
        outcome: 'invited',
        emailSent: index !== 1,
        inviteUrl: `${inviteUrl}${index}`,
      }));
      const answer = { data: { results } };
      const output = renderAnswer(command, answer);
      for (const result of results) {
        expect(output).toContain(result.email);
        expect(output).toContain(result.inviteUrl);
      }
      expect(output).not.toContain('…');
      expect(JSON.parse(output.slice(output.indexOf('[')))).toEqual(results);
    },
  );

  it('keeps mixed existing-account and invited results complete', () => {
    const results = [
      { email: 'existing@example.test', outcome: 'alreadyMember' },
      {
        email: 'new@example.test',
        outcome: 'invited',
        emailSent: true,
        inviteUrl,
      },
    ];
    const output = renderAnswer(command, { data: { results } });
    expect(JSON.parse(output.slice(output.indexOf('[')))).toEqual(results);
  });

  it('preserves the complete URL in create tables and resend fields', () => {
    expect(
      renderTable(
        [{ email: 'new@example.test', inviteUrl }],
        ['email', 'inviteUrl'],
      ),
    ).toContain(inviteUrl);
    expect(renderFields({ inviteUrl })).toContain(inviteUrl);
  });

  it('still bounds ordinary long text', () => {
    expect(renderFields({ summary: 'x'.repeat(100) })).toContain(
      `${'x'.repeat(79)}…`,
    );
  });
});

it('preserves non-invitation structured fields as readable, complete JSON', () => {
  const config = {
    description: 'x'.repeat(160),
    rules: Array.from({ length: 20 }, (_, index) => ({
      name: `rule-${index}`,
      enabled: true,
    })),
  };
  const output = renderFields({ config });
  expect(JSON.parse(output.slice(output.indexOf('{')))).toEqual(config);
  expect(output).toContain('rule-19');
  expect(output).not.toContain('…');
});
