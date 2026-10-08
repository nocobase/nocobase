import { describe, expect, it } from 'vitest';

import { createMailMessageDocument } from '../../client/lib/mail-message-document.js';

const message = { accountId: 'account-1', id: 'message-1', attachments: [] };
const parse = (html: string): Document =>
  new DOMParser().parseFromString(
    createMailMessageDocument(message, html),
    'text/html',
  );

describe('received message document', () => {
  it('uses consistent default heading spacing while preserving sender overrides', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    try {
      const content = frame.contentDocument!;
      content.open();
      content.write(
        createMailMessageDocument(
          message,
          '<p>Intro</p><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5><h6>Six</h6><h2 style="margin:20px 0">Custom</h2><p>End</p>',
        ),
      );
      content.close();
      const headings = [...content.querySelectorAll('h1,h2,h3,h4,h5,h6')];
      const margins = headings
        .slice(0, 6)
        .map(
          (heading) => frame.contentWindow!.getComputedStyle(heading).marginTop,
        );
      expect(new Set(margins).size).toBe(1);
      expect(margins[0]).toBe('8px');
      expect(frame.contentWindow!.getComputedStyle(headings[6]).marginTop).toBe(
        '20px',
      );
    } finally {
      frame.remove();
    }
  });

  it('preserves head styles, body formatting, and email table layout', () => {
    const document = parse(
      `<!doctype html><html lang="zh"><head><style>.banner { color: #123456; padding: 20px; } @media(max-width: 600px) { .banner { width: 100%; } }</style></head><body style="background:#f0f0f0"><table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff"><tbody><tr><td class="banner" colspan="2" style="font-size:22px;font-family:Georgia;text-align:center;border:1px solid red">Styled mail</td></tr></tbody></table></body></html>`,
    );
    expect(document.head.textContent).toContain('@media(max-width: 600px)');
    expect(document.documentElement.lang).toBe('zh');
    expect(document.body.getAttribute('style')).toBe('background:#f0f0f0');
    expect(document.querySelector('table')?.getAttribute('width')).toBe('600');
    expect(document.querySelector('table')?.getAttribute('cellpadding')).toBe(
      '0',
    );
    expect(document.querySelector('td')?.getAttribute('class')).toBe('banner');
    expect(document.querySelector('td')?.getAttribute('colspan')).toBe('2');
    expect(document.querySelector('td')?.getAttribute('style')).toContain(
      'font-family:Georgia',
    );
    expect(document.querySelector('td')?.textContent).toContain('Styled mail');
  });

  it('removes active content, navigation controls and unsafe URLs while preserving ordinary content', () => {
    const document = parse(
      `<head><base href="https://bad.example"><meta http-equiv="refresh" content="0;url=https://bad.example"><link rel="stylesheet" href="https://bad.example/style.css"></head><body onload="bad()"><script>bad()</script><iframe srcdoc="bad"></iframe><object data="bad"></object><svg onload="bad()"></svg><form action="/api/delete"><p>Keep this text</p><input name="secret"><button>Submit</button></form><a href="java&#10;script:bad()" onclick="bad()" ping="/api/delete">Bad link</a><img src="javascript:bad()" srcset="/api/delete 2x" onerror="bad()"><a href="https://example.com" target="_top">Good link</a></body>`,
    );
    expect(
      document.querySelector(
        'script, iframe, object, svg, form, input, button, base, link',
      ),
    ).toBeNull();
    expect(
      document.querySelector(
        '[onload], [onclick], [onerror], [srcset], [ping]',
      ),
    ).toBeNull();
    expect(document.querySelector('meta[http-equiv="refresh"]')).toBeNull();
    expect(document.body?.textContent).toContain('Keep this text');
    expect(document.querySelector('a')?.hasAttribute('href')).toBe(false);
    expect(document.querySelector('img')?.hasAttribute('src')).toBe(false);
    expect(document.querySelector('a[href]')?.getAttribute('target')).toBe(
      '_blank',
    );
    expect(document.querySelector('a[href]')?.getAttribute('rel')).toBe(
      'noopener noreferrer',
    );
    expect(document.head.firstElementChild?.getAttribute('http-equiv')).toBe(
      'Content-Security-Policy',
    );
    expect(document.head.firstElementChild?.getAttribute('content')).toContain(
      "script-src 'none'",
    );
    expect(document.head.firstElementChild?.getAttribute('content')).toContain(
      "form-action 'none'",
    );
  });

  it.each(['personal', 'management'] as const)(
    'retains trusted CID images for %s access',
    (scope) => {
      const html = createMailMessageDocument(
        {
          ...message,
          attachments: [
            {
              id: 'attachment-1',
              messageId: 'message-1',
              providerAttachmentId: 'provider-1',
              fileName: 'logo.png',
              contentType: 'image/png',
              size: 10,
              inline: true,
              contentId: '<logo@example.com>',
            },
          ],
        },
        '<table><tr><td><img src="cid:logo%40example.com" width="120" style="border-radius:8px"><img src="cid:missing"></td></tr></table>',
        scope,
      );
      const document = new DOMParser().parseFromString(html, 'text/html');
      const images = document.querySelectorAll('img');
      expect(images[0]?.getAttribute('src')).toBe(
        `/api/mail/${scope === 'management' ? 'management/' : ''}accounts/account-1/messages/message-1/attachments/attachment-1`,
      );
      expect(images[0]?.getAttribute('width')).toBe('120');
      expect(images[0]?.getAttribute('style')).toBe('border-radius:8px');
      expect(images[1]?.hasAttribute('src')).toBe(false);
    },
  );
});
