import { foldMailQuotedContent } from './mail-quoted-content.js';
import type { MailMessage } from '../mail-client.js';
import { rewriteMailInlineImages } from './mail-inline-images.js';

const ALLOWED_TAGS = new Set(
  'HTML HEAD BODY TITLE STYLE A ABBR ADDRESS ARTICLE ASIDE B BDI BDO BLOCKQUOTE BR CAPTION CENTER CITE CODE COL COLGROUP DD DEL DETAILS DFN DIV DL DT EM FIGCAPTION FIGURE FONT FOOTER H1 H2 H3 H4 H5 H6 HEADER HR I IMG INS KBD LI MAIN MARK NAV OL P PRE Q S SAMP SECTION SMALL SPAN STRIKE STRONG SUB SUMMARY SUP TABLE TBODY TD TFOOT TH THEAD TIME TR TT U UL VAR WBR'.split(
    ' ',
  ),
);
const REMOVED_TAGS = new Set(
  'SCRIPT NOSCRIPT IFRAME FRAME FRAMESET OBJECT EMBED APPLET SVG MATH LINK META BASE TEMPLATE INPUT BUTTON SELECT TEXTAREA'.split(
    ' ',
  ),
);
const FORMATTING_ATTRIBUTES = new Set(
  'id class style title lang dir align valign width height bgcolor border cellpadding cellspacing colspan rowspan span color face size nowrap hspace vspace text link alink vlink'.split(
    ' ',
  ),
);

/** For a script-disabled sandboxed iframe only; never inject into the App DOM. */
export function createMailMessageDocument(
  message: Pick<MailMessage, 'accountId' | 'id' | 'attachments'>,
  html: string,
  scope: 'personal' | 'management' = 'personal',
  quoteLabel?: string,
): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  rewriteMailInlineImages(document, message, scope);
  sanitizeElement(document.documentElement);
  if (quoteLabel) foldMailQuotedContent(document, quoteLabel);

  const policy = document.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content =
    "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src http: https: data:; font-src data:; base-uri 'none'; form-action 'none'";
  const referrer = document.createElement('meta');
  referrer.name = 'referrer';
  referrer.content = 'no-referrer';
  const defaults = document.createElement('style');
  // Theme values are supplied by the parent after the sandbox document parses.
  defaults.textContent =
    'html { color: var(--mail-foreground, #111); background: var(--mail-background, transparent); font: var(--mail-text-sm, 14px)/var(--mail-text-sm--line-height, 1.5) var(--mail-font-sans, Arial, sans-serif); } body { margin: 0; padding: 0; } img { max-width: 100%; } :where(h1, h2, h3, h4, h5, h6) { margin-top: 8px; margin-bottom: 8px; }';
  document.head.prepend(policy, referrer, defaults);
  return `<!doctype html>\n${document.documentElement.outerHTML}`;
}

/** Preserves mail formatting for delivery; render only inside a sandboxed frame. */
export function sanitizeForwardMailHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  sanitizeElement(document.documentElement, true);
  return `<!doctype html>\n${document.documentElement.outerHTML}`;
}

function sanitizeElement(element: Element, allowContentId = false): void {
  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase();
    const link =
      element.tagName === 'A' &&
      name === 'href' &&
      /^(?:https?:|mailto:|tel:|#)/iu.test(attribute.value.trim());
    const image =
      ((element.tagName === 'IMG' && name === 'src') ||
        name === 'background') &&
      (/^(?:https?:|\/(?!\/)|data:image\/(?:gif|jpe?g|png|webp);base64,)/iu.test(
        attribute.value.trim(),
      ) ||
        (allowContentId && /^cid:/iu.test(attribute.value.trim())));
    const citation =
      element.tagName === 'BLOCKQUOTE' &&
      name === 'type' &&
      attribute.value === 'cite';
    const imageText = element.tagName === 'IMG' && name === 'alt';
    if (
      !FORMATTING_ATTRIBUTES.has(name) &&
      !link &&
      !image &&
      !imageText &&
      !citation
    )
      element.removeAttribute(attribute.name);
  }
  if (element.tagName === 'A' && element.hasAttribute('href')) {
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener noreferrer');
  }
  for (const child of [...element.children]) {
    if (REMOVED_TAGS.has(child.tagName)) {
      child.remove();
      continue;
    }
    sanitizeElement(child, allowContentId);
    if (!ALLOWED_TAGS.has(child.tagName))
      child.replaceWith(...child.childNodes);
  }
}
