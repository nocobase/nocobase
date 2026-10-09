import type { MailSignature } from '../mail-client.js';

import { sanitizeMailHtml } from './mail-template.js';

export interface MailSignatureContent {
  readonly text: string;
  readonly html: string;
}

/** Replaces the managed signature suffix without touching the user's message body. */
export function replaceMailSignatureContent(
  content: MailSignatureContent,
  signatures: readonly MailSignature[],
  signatureId: string,
): MailSignatureContent {
  const text = stripKnownSuffix(
    content.text,
    signatures
      .map((signature) => `\n\n-- \n${signature.text}`)
      .filter((suffix) => suffix.trim()),
  );
  const html = stripKnownSuffix(
    content.html,
    signatures
      .map((signature) => signatureHtmlSuffix(signature))
      .filter(Boolean),
  );
  const signature =
    signatureId === '__none__'
      ? undefined
      : signatures.find((item) =>
          signatureId ? item.id === signatureId : item.isDefault,
        );
  if (!signature) return { text, html };
  const signatureHtml = signatureHtmlSuffix(signature);
  return {
    text: signature.text.trim() ? `${text}\n\n-- \n${signature.text}` : text,
    html: signatureHtml ? `${html}${signatureHtml}` : html,
  };
}

function signatureHtmlSuffix(signature: MailSignature): string {
  const content = sanitizeMailHtml(
    signature.html ?? escapeHtmlForSignature(signature.text),
  );
  return content.trim()
    ? `<br><br><div class="nocobase-mail-signature">${content}</div>`
    : '';
}

function stripKnownSuffix(value: string, suffixes: readonly string[]): string {
  const suffix = suffixes.find((candidate) => value.endsWith(candidate));
  return suffix ? value.slice(0, -suffix.length) : value;
}

function escapeHtmlForSignature(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('\n', '<br>');
}
