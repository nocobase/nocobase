import { expect, it } from 'vitest';

import { renderFields, renderTable } from '../src/dynamic/output.ts';

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
