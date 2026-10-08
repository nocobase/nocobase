import { describe, expect, it } from 'vitest';
import type { MailMessage } from '../../client/mail-client.js';
import {
  composeMailBody,
  createForwardQuote,
  readDraftComposerBody,
} from '../../client/lib/mail-forward-content.js';
import {
  buildComposerInput,
  EMPTY_COMPOSER,
  readComposerRecovery,
  writeComposerRecovery,
} from '../../client/lib/mail-composer-state.js';
import { createMailMessageDocument } from '../../client/lib/mail-message-document.js';

const source: MailMessage = {
  id: 'original',
  accountId: 'account-1',
  providerMessageId: 'provider-1',
  subject: 'Styled original',
  to: [],
  cc: [],
  bcc: [],
  replyTo: [],
  references: [],
  folderIds: [],
  labelIds: [],
  read: true,
  starred: false,
  draft: false,
  hasAttachments: false,
  attachments: [],
  html: '<html><head><style>.banner { color: red; padding: 20px; } @media(max-width:600px) { table { width:100%; } }</style></head><body style="background:#eee"><table width="600"><tr><td class="banner" style="font-family:Georgia;border:1px solid red">Original body<img src="cid:logo"></td></tr></table><script>alert(1)</script></body></html>',
};

describe('forwarded mail formatting', () => {
  it('preserves original CSS, layout and CID references when editing the comment and reopening a draft', () => {
    const composer = {
      ...EMPTY_COMPOSER,
      mode: 'forward' as const,
      relatedMessageId: source.id,
      forwardBodyIncluded: true,
      subject: 'Fwd: Styled original',
      text: 'Please review',
      html: '<p>Please review</p>',
      forwardQuote: createForwardQuote(source),
    };
    const input = buildComposerInput(
      'account-1',
      'identity-1',
      '',
      composer,
      [],
      [],
    );
    expect(input.signatureId).toBeNull();
    const sent = new DOMParser().parseFromString(input.html!, 'text/html');
    expect(sent.head.textContent).toContain('@media(max-width:600px)');
    expect(sent.body.getAttribute('style')).toBe('background:#eee');
    expect(sent.querySelector('td')?.getAttribute('class')).toBe('banner');
    expect(sent.querySelector('td')?.getAttribute('style')).toContain(
      'font-family:Georgia',
    );
    expect(sent.querySelector('table')?.getAttribute('width')).toBe('600');
    expect(sent.querySelector('img')?.getAttribute('src')).toBe('cid:logo');
    expect(sent.querySelector('script')).toBeNull();
    expect(input.text).toBe('Please review\n\nOriginal body');
    const restored = readDraftComposerBody({
      ...source,
      ...input,
      id: 'draft-1',
    });
    expect(restored.html).toBe('<p>Please review</p>');
    expect(restored.forwardQuote?.html).toContain('.banner');
    const edited = composeMailBody({
      ...restored,
      html: '<p>Updated note</p>',
      text: 'Updated note',
    });
    expect(edited.html.match(/Original body/gu)).toHaveLength(1);
    expect(edited.html).not.toContain('Please review');
    expect(edited.text).toBe('Updated note\n\nOriginal body');
    expect(edited.html).toContain('font-family:Georgia');
  });

  it('keeps styled quotes through session recovery and only rewrites CID URLs for preview', () => {
    const forwardQuote = createForwardQuote({
      ...source,
      attachments: [
        {
          id: 'attachment-1',
          messageId: source.id,
          providerAttachmentId: 'remote-1',
          fileName: 'logo.png',
          contentType: 'image/png',
          size: 1,
          inline: true,
          contentId: 'logo',
        },
      ],
    });
    writeComposerRecovery({
      version: 1,
      accountId: 'account-1',
      identityId: 'identity-1',
      composer: { ...EMPTY_COMPOSER, subject: 'Fwd: Original', forwardQuote },
      composeAttachments: [],
      retainedAttachments: [],
    });
    const recovered = readComposerRecovery('account-1')!.composer;
    expect(recovered.forwardQuote?.html).toContain('<style>');
    const preview = createMailMessageDocument(forwardQuote, forwardQuote.html);
    expect(preview).toContain(
      '/api/mail/accounts/account-1/messages/original/attachments/attachment-1',
    );
    const body = composeMailBody(recovered);
    expect(body.html).toContain('src="cid:logo"');
    expect(body.html).not.toContain('/api/mail/');
    window.sessionStorage.clear();
  });

  it('preserves plain text and nested forwards without duplicating quoted bodies', () => {
    const forwardQuote = createForwardQuote({
      ...source,
      html: undefined,
      text: 'Plain <text>\nSecond line',
    });
    const first = composeMailBody({
      html: '<p>First note</p>',
      text: 'First note',
      forwardQuote,
    });
    const nested = composeMailBody({
      html: '<p>Second note</p>',
      text: 'Second note',
      forwardQuote: createForwardQuote({ ...source, ...first }),
    });
    const restored = readDraftComposerBody({ ...source, ...nested });
    const saved = composeMailBody(restored);
    expect(saved.html.match(/First note/gu)).toHaveLength(1);
    expect(saved.html.match(/Plain &lt;text&gt;/gu)).toHaveLength(1);
    expect(restored.html).toBe('<p>Second note</p>');
  });
});
