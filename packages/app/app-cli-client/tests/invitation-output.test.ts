import { describe, expect, it } from 'vitest';

import { renderFields, renderTable } from '../src/dynamic/output.ts';

describe('copyable invitation URLs', () => {
  const inviteUrl = `https://application.example.test/long/public/base/path/invite/${'a'.repeat(43)}`;

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
