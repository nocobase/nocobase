import { act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { observeMailBodyTheme } from '../../client/lib/mail-body-theme.js';
import { createMailMessageDocument } from '../../client/lib/mail-message-document.js';

const message = { accountId: 'account', id: 'message', attachments: [] };

afterEach(() => {
  document.documentElement.className = '';
  document.body.replaceChildren();
});

describe('isolated mail theme', () => {
  it('adapts inline important colors and legacy table colors, then restores sender formatting without replacing content', async () => {
    const frame = document.createElement('iframe');
    frame.style.cssText =
      '--background:#181818;--foreground:#eeeeee;--primary:#99bbff;--border:#444;--muted-foreground:#aaa';
    document.body.append(frame);
    const mail = new DOMParser().parseFromString(
      createMailMessageDocument(
        message,
        '<body style="background:white!important;color:black!important"><table bgcolor="white"><tr><td style="color:black!important;background:white!important;border:1px solid black"><a href="https://example.com"><span style="color:blue">Link</span></a><img src="https://example.com/logo.png"><details open><summary>History</summary>Old message</details></td></tr></table></body>',
      ),
      'text/html',
    );
    mail.querySelector('details')!.open = true;
    const cell = mail.querySelector('td')!;
    const original = cell.getAttribute('style');
    document.documentElement.classList.add('dark');
    const stop = observeMailBodyTheme(frame, mail);
    expect(
      mail.documentElement.style.getPropertyValue('--mail-background'),
    ).toBe('transparent');
    expect(mail.documentElement.style.colorScheme).toBe('dark');
    expect(frame.style.colorScheme).toBe('dark');
    expect(cell.style.color).toBe('var(--mail-foreground)');
    expect(mail.querySelector('table')!.style.backgroundColor).toBe(
      'var(--mail-background)',
    );
    expect(mail.querySelector('span')!.style.color).toBe('var(--mail-primary)');
    expect(mail.querySelector('img')!.src).toBe('https://example.com/logo.png');
    expect(mail.querySelector('img')!.style.filter).toBe('');

    await act(async () => {
      document.documentElement.classList.remove('dark');
    });
    expect(mail.documentElement.style.colorScheme).toBe('light');
    expect(cell.getAttribute('style')).toBe(original);
    expect(mail.querySelector('table')!.getAttribute('bgcolor')).toBe('white');
    expect(mail.querySelector('details')!.open).toBe(true);
    stop();
    await act(async () => {
      document.documentElement.classList.add('dark');
    });
    expect(mail.documentElement.style.colorScheme).toBe('light');
  });

  it('tracks token changes in a scoped theme and preserves iframe sandbox policy', async () => {
    const scope = document.createElement('div');
    scope.className = 'dark';
    const frame = document.createElement('iframe');
    frame.style.color = '#eee';
    frame.style.setProperty('--primary', '#99bbff');
    scope.append(frame);
    document.body.append(scope);
    const mail = new DOMParser().parseFromString(
      createMailMessageDocument(message, '<p>Body</p>'),
      'text/html',
    );
    const stop = observeMailBodyTheme(frame, mail);
    frame.style.color = '#ddd';
    frame.style.setProperty('--primary', '#aaccff');
    await act(async () => {
      scope.setAttribute('data-theme', 'compact');
    });
    expect(
      mail.documentElement.style.getPropertyValue('--mail-foreground'),
    ).toBe('rgb(221, 221, 221)');
    expect(mail.documentElement.style.getPropertyValue('--mail-primary')).toBe(
      '#aaccff',
    );
    expect(
      mail
        .querySelector('meta[http-equiv="Content-Security-Policy"]')!
        .getAttribute('content'),
    ).toContain("script-src 'none'");
    stop();
  });
});
