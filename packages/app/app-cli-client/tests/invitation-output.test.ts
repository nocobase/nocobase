import { expect, it } from 'vitest';

import {
  renderAnswer,
  renderFields,
  renderTable,
} from '../src/dynamic/output.ts';

it('preserves complete invitation URLs in tables and fields', () => {
  const inviteUrl = `https://application.example.test/long/public/base/path/invite/${'a'.repeat(43)}`;
  expect(
    renderTable(
      [{ email: 'new@example.test', inviteUrl }],
      ['email', 'inviteUrl'],
    ),
  ).toContain(inviteUrl);
  expect(renderFields({ inviteUrl })).toContain(inviteUrl);
});

it('keeps ordinary text and structured fields compact', () => {
  const config = { description: 'x'.repeat(160), rules: ['first', 'second'] };
  expect(renderFields({ summary: 'x'.repeat(100) })).toBe(
    `summary  ${'x'.repeat(79)}…`,
  );
  expect(renderFields({ config })).toBe(
    `config  ${JSON.stringify(config).slice(0, 79)}…`,
  );
});

it('shows every batch result with its delivery reason and complete manual link', () => {
  const inviteUrl = `https://example.test/invite/${'a'.repeat(43)}`;
  const emailError = 'Email not sent: no email channel configured';
  const output = renderAnswer(
    {
      id: 'project:invitation:create',
      summary: 'Invite people',
      method: 'POST',
      path: '/projects/invitations',
      parameters: [],
      identities: ['person'],
      output: {
        kind: 'data',
        columns: ['email', 'emailSent', 'emailError', 'inviteUrl'],
      },
    },
    {
      data: {
        results: [
          { email: 'first@example.test', emailSent: true, inviteUrl },
          {
            email: 'second@example.test',
            emailSent: false,
            emailError,
            inviteUrl,
          },
        ],
      },
    },
  );
  expect(output).toContain('first@example.test');
  expect(output).toContain('second@example.test');
  expect(output).toContain(emailError);
  expect(output.match(/https:\/\/example.test\/invite\//gu)).toHaveLength(2);
  expect(output).toContain(inviteUrl);
  expect(output).not.toContain('…');
});
