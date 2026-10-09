import type { MailMessage } from '../mail-client.js';
import type { MailForwardQuote } from '../contracts/composer.js';
import { sanitizeForwardMailHtml } from './mail-message-document.js';
import {
  htmlToPlainText,
  plainTextToMailHtml,
  sanitizeMailHtml,
} from './mail-template.js';

export type { MailForwardQuote } from '../contracts/composer.js';

export interface MailComposerBody {
  readonly html: string;
  readonly text: string;
  readonly forwardQuote?: MailForwardQuote;
}

const QUOTE_START = 'nocobase-mail-forward:start';
const QUOTE_END = 'nocobase-mail-forward:end';
const REPLY_START = 'nocobase-mail-reply:start';
const REPLY_END = 'nocobase-mail-reply:end';

export function createReplyQuote(message: MailMessage): MailForwardQuote {
  const quote = createForwardQuote(message);
  const document = new DOMParser().parseFromString(quote.html, 'text/html');
  const attribution = document.createElement('p');
  const sender = message.from?.name || message.from?.address || '';
  attribution.textContent = sender ? `${sender} wrote:` : 'Original message:';
  document.body.prepend(attribution);
  return {
    ...quote,
    kind: 'reply',
    html: document.documentElement.outerHTML,
    text: [attribution.textContent, quote.text].join('\n'),
  };
}

export function createForwardQuote(message: MailMessage): MailForwardQuote {
  return {
    id: message.id,
    accountId: message.accountId,
    attachments: message.attachments,
    html: sanitizeForwardMailHtml(
      message.html || plainTextToMailHtml(message.text ?? ''),
    ),
    text: message.text || htmlToPlainText(message.html ?? '').trim(),
  };
}

export function composeMailBody(body: MailComposerBody): {
  html: string;
  text: string;
} {
  const quote = body.forwardQuote;
  if (!quote) return { html: body.html, text: body.text };
  const document = new DOMParser().parseFromString(
    sanitizeForwardMailHtml(quote.html),
    'text/html',
  );
  if (quote.kind === 'reply') {
    const citation = document.createElement('blockquote');
    citation.setAttribute('type', 'cite');
    citation.append(...document.body.childNodes);
    document.body.append(citation);
  }
  const comment = document.createElement('div');
  comment.setAttribute('data-nocobase-mail-comment', '1');
  comment.innerHTML = sanitizeMailHtml(
    body.html || plainTextToMailHtml(body.text),
  );
  // Boundary comments avoid wrapping the original body in another element.
  document.body.prepend(
    comment,
    document.createComment(quote.kind === 'reply' ? REPLY_START : QUOTE_START),
  );
  document.body.append(
    document.createComment(quote.kind === 'reply' ? REPLY_END : QUOTE_END),
  );
  return {
    html: `<!doctype html>\n${document.documentElement.outerHTML}`,
    text: [
      body.text,
      quote.kind === 'reply'
        ? quote.text
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')
        : quote.text,
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
}

/** Restores the editable comment without feeding quoted CSS through the editor. */
export function readDraftComposerBody(message: MailMessage): MailComposerBody {
  const html = message.html || plainTextToMailHtml(message.text ?? '');
  const document = new DOMParser().parseFromString(html, 'text/html');
  const comment = document.body.firstElementChild;
  const nodes = [...document.body.childNodes];
  const start = nodes.findIndex(
    (node) =>
      node.nodeType === 8 &&
      (node.nodeValue === QUOTE_START || node.nodeValue === REPLY_START),
  );
  const reply = nodes[start]?.nodeValue === REPLY_START;
  const end = nodes
    .map((node) => (node.nodeType === 8 ? node.nodeValue : null))
    .lastIndexOf(reply ? REPLY_END : QUOTE_END);
  if (
    comment?.getAttribute('data-nocobase-mail-comment') !== '1' ||
    start < 0 ||
    end <= start
  ) {
    return { html, text: message.text ?? '' };
  }
  const commentHtml = sanitizeMailHtml(
    comment.innerHTML +
      nodes
        .slice(end + 1)
        .map((node) => {
          const container = document.createElement('div');
          container.append(node.cloneNode(true));
          return container.innerHTML;
        })
        .join(''),
  );
  document.body.replaceChildren(...nodes.slice(start + 1, end));
  if (
    reply &&
    document.body.children.length === 1 &&
    document.body.firstElementChild?.matches('blockquote[type="cite"]')
  ) {
    document.body.replaceChildren(
      ...document.body.firstElementChild.childNodes,
    );
  }
  const quoteHtml = sanitizeForwardMailHtml(document.documentElement.outerHTML);
  return {
    html: commentHtml,
    text: htmlToPlainText(commentHtml),
    forwardQuote: {
      kind: reply ? 'reply' : 'forward',
      id: message.id,
      accountId: message.accountId,
      attachments: message.attachments,
      html: quoteHtml,
      text: htmlToPlainText(document.body.innerHTML).trim(),
    },
  };
}

/** Remove a discarded inline upload without stripping the original message's CSS. */
export function removeQuotedImage(
  quote: MailForwardQuote | undefined,
  contentId: string | undefined,
): MailForwardQuote | undefined {
  if (!quote || !contentId) return quote;
  const document = new DOMParser().parseFromString(quote.html, 'text/html');
  const source = `cid:${contentId.replace(/^<|>$/gu, '')}`;
  for (const image of document.querySelectorAll('img')) {
    if (image.getAttribute('src') === source) image.remove();
  }
  return { ...quote, html: document.documentElement.outerHTML };
}
