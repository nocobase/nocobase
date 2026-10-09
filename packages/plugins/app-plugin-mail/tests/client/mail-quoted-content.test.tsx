import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createMailMessageDocument } from '../../client/lib/mail-message-document.js';
import {
  composeMailBody,
  createReplyQuote,
  readDraftComposerBody,
  removeQuotedImage,
} from '../../client/lib/mail-forward-content.js';
import { splitMailQuotedText } from '../../client/lib/mail-quoted-content.js';
import {
  buildComposerInput,
  EMPTY_COMPOSER,
  buildDraftComposerInput,
  composerFingerprint,
} from '../../client/lib/mail-composer-state.js';
import { MailTextBody } from '../../client/components/mail-text-body.js';
import { MailHtmlBody } from '../../client/components/mail-html-body.js';
import type { MailMessage } from '../../client/mail-client.js';

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({
    t: (_: string, options: { defaultValue: string }) => options.defaultValue,
  }),
}));
const message: MailMessage = {
  id: 'source',
  accountId: 'account',
  providerMessageId: 'remote',
  subject: 'Original',
  from: { address: 'sender@example.com' },
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
  html: '<html><head><style>.original{color:red}</style></head><body><p class="original">Original body</p></body></html>',
};
const parse = (html: string): Document =>
  new DOMParser().parseFromString(
    createMailMessageDocument(message, html, 'personal', 'Quoted content'),
    'text/html',
  );

describe('mail history', () => {
  it('includes a reply quote and restores only the editable response through repeated draft saves', () => {
    const input = buildComposerInput(
      'account',
      'identity',
      '',
      {
        ...EMPTY_COMPOSER,
        mode: 'reply',
        relatedMessageId: message.id,
        html: '<p>New response</p>',
        text: 'New response',
        forwardQuote: createReplyQuote(message),
      },
      [],
      [],
    );
    expect(input).toMatchObject({
      inReplyToMessageId: 'source',
      replyBodyIncluded: true,
      signatureId: null,
    });
    expect(input.text).toContain('> Original body');
    expect(input.html).toContain('blockquote type="cite"');
    expect(input.html).toContain('.original{color:red}');
    let draft = { ...message, ...input };
    for (let index = 0; index < 3; index++) {
      const restored = readDraftComposerBody(draft);
      expect(restored.html).toBe('<p>New response</p>');
      expect(restored.forwardQuote?.kind).toBe('reply');
      const composed = composeMailBody(restored);
      expect(composed.html.match(/Original body/gu)).toHaveLength(1);
      expect(composed.html.match(/<blockquote/gu)).toHaveLength(1);
      expect(composed.text).toContain('> Original body');
      draft = { ...draft, ...composed };
    }
    const document = parse(draft.html!);
    expect(document.querySelector('details')?.hasAttribute('open')).toBe(false);
    expect(document.querySelector('details')?.textContent).toContain(
      'Original body',
    );
    expect(document.querySelector('details')?.textContent).not.toContain(
      'New response',
    );
    expect(document.body.textContent).toContain('New response');
  });

  it('omits removed quotes from drafts while preserving attachments and tracking the change', () => {
    const quoted = {
      ...EMPTY_COMPOSER,
      mode: 'reply' as const,
      relatedMessageId: message.id,
      text: 'Reply',
      html: '<p>Reply</p>',
      forwardQuote: createReplyQuote(message),
    };
    const removed = {
      ...quoted,
      forwardQuote: undefined,
      removedForwardQuote: quoted.forwardQuote,
    };
    expect(composerFingerprint(removed, 'identity', '', [], [])).not.toBe(
      composerFingerprint(quoted, 'identity', '', [], []),
    );
    const attachment = {
      id: 'retained',
      providerAttachmentId: 'remote-attachment',
      fileName: 'report.pdf',
      contentType: 'application/pdf',
      size: 10,
    };
    const input = buildDraftComposerInput(
      'account',
      'identity',
      '',
      removed,
      [],
      [attachment],
    );
    expect(input).toMatchObject({
      text: 'Reply',
      html: '<p>Reply</p>',
      replyBodyIncluded: true,
      retainedAttachmentIds: ['retained'],
    });
    expect(
      readDraftComposerBody({ ...message, ...input }).forwardQuote,
    ).toBeUndefined();
    const reopened = buildComposerInput(
      'account',
      'identity',
      '',
      {
        ...EMPTY_COMPOSER,
        mode: 'edit',
        ...readDraftComposerBody({ ...message, ...input }),
        draftSource: { replyToMessageId: message.id },
      },
      [],
      [],
    );
    expect(reopened).toMatchObject({
      replyBodyIncluded: true,
      text: 'Reply',
      html: '<p>Reply</p>',
    });
  });

  it.each([
    '<p>New</p><div class="gmail_quote">Old<blockquote type="cite">Older</blockquote></div>',
    '<p>New</p><div class="yahoo_quoted">Old</div>',
    '<p>New</p><blockquote type="cite">Old</blockquote>',
    '<p>New</p><div id="divRplyFwdMsg">Old header</div><p>Old body</p>',
    '<p>New</p><div class="moz-cite-prefix">Old header</div><blockquote type="cite">Old body</blockquote>',
  ])(
    'folds known provider history without hiding the new response: %s',
    (html) => {
      const document = parse(html);
      expect(document.querySelectorAll('details')).toHaveLength(1);
      expect(document.querySelector('details')?.textContent).toContain('Old');
      expect(document.querySelector('details')?.textContent).not.toContain(
        'New',
      );
      expect(document.querySelector('summary')?.textContent).toBe(
        'Quoted content',
      );
      expect(document.querySelector('details')?.open).toBe(false);
    },
  );

  it('does not collapse ordinary authored quotations or change sent markup', () => {
    expect(
      parse(
        '<p>New</p><blockquote>Authored quotation</blockquote>',
      ).querySelector('details'),
    ).toBeNull();
    const source = createReplyQuote(message);
    const sent = composeMailBody({
      text: 'Reply',
      html: '<p>Reply</p>',
      forwardQuote: source,
    });
    expect(sent.html).not.toContain('<details');
    expect(sent.html).not.toContain('/api/mail/');
  });

  it('removes discarded quote images while retaining the source CSS', () => {
    const quote = createReplyQuote({
      ...message,
      html: '<head><style>p{color:red}</style></head><body><p>Original</p><img src="cid:one"><img src="cid:two"></body>',
    });
    const changed = removeQuotedImage(quote, 'one');
    expect(changed?.html).toContain('p{color:red}');
    expect(changed?.html).not.toContain('cid:one');
    expect(changed?.html).toContain('cid:two');
    expect(removeQuotedImage(undefined, 'one')).toBeUndefined();
    expect(removeQuotedImage(quote, undefined)).toBe(quote);
  });

  it('keeps interleaved text visible and folds trailing text history', () => {
    expect(splitMailQuotedText('Reply\n> Original\n> Second')).toEqual({
      body: 'Reply',
      quote: '> Original\n> Second',
    });
    const interleaved = '> First\nMy inline reply\n> Second';
    expect(splitMailQuotedText(interleaved)).toEqual({ body: interleaved });
    render(
      <MailTextBody text={'Reply\nOn Monday, sender wrote:\n> Original'} />,
    );
    const trigger = screen.getByRole('button', { name: 'Quoted content' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Original/)).not.toBeInTheDocument();
    expect(screen.getByText(/Reply/)).toBeVisible();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Original/)).toBeVisible();
  });

  it('folds quotes in the reading iframe and preserves the full composer preview', () => {
    const quoted = {
      ...message,
      html: '<p>New</p><blockquote type="cite">Old</blockquote>',
    };
    const { rerender } = render(
      <MailHtmlBody message={quoted} title='Message' />,
    );
    expect(screen.getByTitle('Message').getAttribute('srcdoc')).toContain(
      '<details',
    );
    rerender(
      <MailHtmlBody message={quoted} title='Message' collapseQuotes={false} />,
    );
    expect(screen.getByTitle('Message').getAttribute('srcdoc')).not.toContain(
      '<details',
    );
  });
});
