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

describe('Redactor edge cases', () => {
  const redactor = new Redactor();

  it('keeps an alias to a masked value valid', () => {
    const masked = redactor.yaml(
      'db:\n  password: &p hunter2\nother:\n  copy: *p\n',
    );
    expect(masked).toContain('password: &p ••••••');
    expect(masked).toContain('copy: *p');
    expect(masked).not.toContain('hunter2');
  });

  it('masks what a commented-out credential block holds', () => {
    const masked = redactor.yaml(
      [
        '# key: |',
        '#   -----BEGIN PRIVATE KEY-----',
        '#   hunter2',
        '# secrets:',
        '#   keys:',
        '#     - key: hunter2',
        '# app:',
        '#   publicOrigin: https://apps.example.com',
        'a: 1',
        '',
      ].join('\n'),
    );
    expect(masked).not.toContain('hunter2');
    expect(masked).not.toContain('BEGIN PRIVATE KEY');
    expect(masked).toContain('#   publicOrigin: https://apps.example.com');
    expect(masked).toContain('a: 1');
  });

  it('shows a file of comments only without a null line', () => {
    expect(redactor.yaml('# nothing set yet\n')).toBe('# nothing set yet\n');
  });

  it.each([
    ['custom.accessTokenEnc', 'hunter2', true],
    ['custom.smtpPwdValue', 'hunter2', true],
    ['custom.args', '--password=hunter2', true],
    ['caching.keyPrefix', 'nb:', false],
    ['custom.note', 'visible', false],
  ])('judges the text at %s', (path, text, hidden) => {
    expect(redactor.value(path, text) === '[redacted]').toBe(hidden);
    expect(
      redactor
        .yaml(`${path.split('.')[1]}: ${JSON.stringify(text)}\n`)
        .includes(text),
    ).toBe(!hidden);
  });
});

it('keeps commented-out limits readable while masking credentials', () => {
  const masked = new Redactor().yaml(
    [
      '# realtime:',
      '#   authorizationTimeoutMs: 5000',
      '#   limits:',
      '#     maxConcurrentAuthorizations: 256',
      '# knowledge:',
      '#   url: postgresql://kb_user:hunter2@127.0.0.1:5432/knowledge',
      'users:',
      '  initialAdmin:',
      '    password: admin123',
      '',
    ].join('\n'),
  );
  expect(masked).toContain('authorizationTimeoutMs: 5000');
  expect(masked).toContain('maxConcurrentAuthorizations: 256');
  expect(masked).toContain('#   url: ••••••');
  expect(masked).toContain('password: ••••••');
  expect(masked).not.toMatch(/hunter2|admin123/u);
});

it('keeps counts named after a group readable', () => {
  const redactor = new Redactor();
  expect(
    redactor.value('realtime.limits.maxConcurrentAuthorizations', 256),
  ).toBe(256);
  expect(redactor.value('custom.authorization', 'Bearer x')).toBe('[redacted]');
  expect(
    redactor.yaml('limits:\n  maxPendingAuthorizations: 2048\n'),
  ).toContain('2048');
});
