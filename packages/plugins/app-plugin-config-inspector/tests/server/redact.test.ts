import { describe, expect, it } from 'vitest';

import { hasCredentialUrl, Redactor } from '../../server/redact.js';

describe('Redactor', () => {
  const redactor = new Redactor(new Set(['mail.oauthClient']));

  it.each([
    ['database.connections.main.password', true],
    ['secrets.keys.0.key', true],
    ['auth.secret', true],
    ['mailers.system.apiKey', true],
    ['notification.channels.ops.webhookUrl', true],
    ['mail.oauthClient.id', true],
    ['database.connections.main.primaryKey', false],
    ['auth.emailAndPassword.enabled', false],
    ['logging.level', false],
    ['session.cookie.name', false],
    ['authorization.plugins', false],
    ['session.previousSecrets', true],
    ['drive.disks.s3.credentials', true],
  ])('treats %s as sensitive: %s', (path, sensitive) => {
    expect(redactor.isSensitive(path)).toBe(sensitive);
  });

  it('hides credentials inside values', () => {
    expect(
      redactor.value('', {
        app: { publicOrigin: 'https://u:p@example.com' },
        list: ['a', 'postgres://u:p@db/x'],
        safe: 'https://example.com/path?page=2',
        nested: { password: { a: 1 } },
      }),
    ).toEqual({
      app: { publicOrigin: '[redacted]' },
      list: ['a', '[redacted]'],
      safe: 'https://example.com/path?page=2',
      nested: { password: '[redacted]' },
    });
  });

  it.each([
    ['https://user:pass@example.com', true],
    ['https://example.com/?access_token=x', true],
    ['https://oapi.example.com/robot/send?access_token=x', true],
    ['https://open.example.com/bot/v2/hook/abc', true],
    ['https://example.com/docs?page=1', false],
    ['not a url', false],
  ])('detects credentials in %s: %s', (text, expected) => {
    expect(hasCredentialUrl(text)).toBe(expected);
  });

  it('masks YAML values and commented-out settings, keeping comments', () => {
    const text = [
      '# Keep this comment',
      'database:',
      '  password: "quoted secret" # inline note',
      '  host: db.internal',
      'secrets:',
      '  keys:',
      '    - version: 1',
      '      key: abc',
      '#   apiKey: leftover',
      'url: "a # not a comment"',
      '',
    ].join('\n');
    const masked = redactor.yaml(text);
    expect(masked).toContain('# Keep this comment');
    expect(masked).toContain('password: •••••• # inline note');
    expect(masked).toContain('host: db.internal');
    expect(masked).toContain('secrets: ••••••');
    expect(masked).toContain('#   apiKey: ••••••');
    expect(masked).toContain('url: "a # not a comment"');
    expect(masked).not.toMatch(/quoted secret|abc|leftover/u);
  });

  it('does not show a file that does not parse', () => {
    expect(redactor.yaml('a: [unclosed\npassword: x')).not.toContain(
      'password',
    );
  });
});
