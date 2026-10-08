import type {
  MailAccountView,
  MailComposeInput,
  MailIdentity,
  MailMessage,
  MailOutboundAttachmentView,
  MailProviderCapabilities,
  MailProviderView,
  MailSignature,
} from '../mail-client.js';
import {
  EMPTY_MAIL_COMPOSER,
  type ComposerState,
} from '../contracts/composer.js';
import { replaceMailSignatureContent } from './mail-signature.js';
import { sanitizeMailHtml } from './mail-template.js';
import { composeMailBody } from './mail-forward-content.js';

export type { ComposerState } from '../contracts/composer.js';

export const EMPTY_COMPOSER: ComposerState = EMPTY_MAIL_COMPOSER;

export interface ComposerRecoverySnapshot {
  readonly version: 1;
  readonly accountId: string;
  readonly identityId: string;
  readonly signatureId?: string;
  readonly composer: ComposerState;
  readonly composeAttachments: readonly MailOutboundAttachmentView[];
  readonly retainedAttachments: MailMessage['attachments'];
  readonly savedFingerprint?: string;
  readonly draftKey?: string;
  readonly draftRevision?: number;
}

const COMPOSER_RECOVERY_KEY_PREFIX = 'nocobase:mail:composer-recovery:v1:';

export function parseAddressList(
  value: string,
): readonly { address: string }[] {
  return value
    .split(/[;,\n]/u)
    .map((address) => address.trim())
    .filter(Boolean)
    .map((address) => ({ address }));
}

export function replaceComposerSignature(
  composer: ComposerState,
  signatures: readonly MailSignature[],
  signatureId: string,
): ComposerState {
  return {
    ...composer,
    ...replaceMailSignatureContent(
      { text: composer.text, html: composer.html },
      signatures,
      signatureId,
    ),
  };
}

export function buildComposerInput(
  accountId: string,
  identityId: string,
  _signatureId: string,
  composer: ComposerState,
  attachments: readonly MailOutboundAttachmentView[],
  retainedAttachments: MailMessage['attachments'],
): MailComposeInput {
  const body = composeMailBody(composer);
  return {
    accountId,
    identityId,
    // The editor owns the complete body, including any selected signature.
    signatureId: null,
    to: parseAddressList(composer.to),
    cc: parseAddressList(composer.cc),
    bcc: parseAddressList(composer.bcc),
    subject: composer.subject,
    text: body.text,
    html: body.html || undefined,
    replyBodyIncluded:
      composer.mode === 'reply' ||
      Boolean(composer.draftSource?.replyToMessageId) ||
      composer.forwardQuote?.kind === 'reply' ||
      composer.removedForwardQuote?.kind === 'reply' ||
      undefined,
    inReplyToMessageId:
      composer.mode === 'reply'
        ? composer.relatedMessageId
        : composer.draftSource?.replyToMessageId,
    forwardOfMessageId:
      composer.mode === 'forward'
        ? composer.relatedMessageId
        : composer.draftSource?.forwardOfMessageId,
    ...((composer.mode === 'forward' && composer.forwardBodyIncluded) ||
    composer.draftSource?.forwardOfMessageId
      ? { forwardBodyIncluded: true }
      : {}),
    scheduledAt: composer.scheduledAt
      ? new Date(composer.scheduledAt).toISOString()
      : undefined,
    draftMessageId: composer.draftMessageId,
    attachmentIds: attachments.map((attachment) => attachment.id),
    retainedAttachmentIds: retainedAttachments.map(
      (attachment) => attachment.id,
    ),
    idempotencyKey: crypto.randomUUID(),
  };
}

export function buildDraftComposerInput(
  accountId: string,
  identityId: string,
  signatureId: string,
  composer: ComposerState,
  attachments: readonly MailOutboundAttachmentView[],
  retainedAttachments: MailMessage['attachments'],
): MailComposeInput {
  return {
    ...buildComposerInput(
      accountId,
      identityId,
      signatureId,
      composer,
      attachments,
      retainedAttachments,
    ),
    scheduledAt: undefined,
  };
}

export function mergeProviderDraftBody(
  current: string,
  submitted: string,
  providerValue: string | undefined,
): string {
  if (!providerValue || providerValue === submitted) return current;
  if (!providerValue.startsWith(submitted)) return current;
  const providerSuffix = providerValue.slice(submitted.length);
  return current.endsWith(providerSuffix)
    ? current
    : `${current}${providerSuffix}`;
}

export function composerFingerprint(
  composer: ComposerState,
  identityId: string,
  signatureId: string,
  attachments: readonly MailOutboundAttachmentView[],
  retainedAttachments: MailMessage['attachments'],
): string {
  return JSON.stringify({
    mode: composer.mode,
    relatedMessageId: composer.relatedMessageId,
    forwardQuote: composer.forwardQuote,
    removedForwardQuote: composer.removedForwardQuote,
    fromAddress: composer.fromAddress,
    to: composer.to,
    cc: composer.cc,
    bcc: composer.bcc,
    subject: composer.subject,
    text: composer.text,
    html: composer.html,
    identityId,
    signatureId,
    attachmentIds: attachments.map((attachment) => attachment.id),
    retainedAttachmentIds: retainedAttachments.map(
      (attachment) => attachment.id,
    ),
  });
}

export function readComposerRecovery(
  accountId: string,
): ComposerRecoverySnapshot | undefined {
  try {
    const raw = window.sessionStorage.getItem(composerRecoveryKey(accountId));
    if (!raw) return undefined;
    const snapshot: unknown = JSON.parse(raw);
    if (
      !isComposerRecoverySnapshot(snapshot) ||
      snapshot.accountId !== accountId ||
      !hasRecoveryContent(snapshot)
    ) {
      return undefined;
    }
    return {
      ...snapshot,
      composer: {
        ...snapshot.composer,
        html: sanitizeMailHtml(snapshot.composer.html),
      },
    };
  } catch {
    clearComposerRecovery(accountId);
    return undefined;
  }
}

function hasRecoveryContent(snapshot: ComposerRecoverySnapshot): boolean {
  const { composer } = snapshot;
  return Boolean(
    composer.to.trim() ||
    composer.cc.trim() ||
    composer.bcc.trim() ||
    composer.subject.trim() ||
    composer.text.trim() ||
    composer.scheduledAt ||
    composer.draftMessageId ||
    snapshot.composeAttachments.length ||
    snapshot.retainedAttachments.length,
  );
}

export function writeComposerRecovery(
  snapshot: ComposerRecoverySnapshot,
): void {
  try {
    window.sessionStorage.setItem(
      composerRecoveryKey(snapshot.accountId),
      JSON.stringify(snapshot),
    );
  } catch {
    // Browser privacy settings or storage pressure can disable recovery.
  }
}

export function clearComposerRecovery(accountId: string): void {
  try {
    window.sessionStorage.removeItem(composerRecoveryKey(accountId));
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function composerRecoveryKey(accountId: string): string {
  return `${COMPOSER_RECOVERY_KEY_PREFIX}${accountId}`;
}

function isComposerRecoverySnapshot(
  value: unknown,
): value is ComposerRecoverySnapshot {
  if (!isRecord(value) || value.version !== 1) return false;
  if (
    typeof value.accountId !== 'string' ||
    typeof value.identityId !== 'string' ||
    (value.signatureId !== undefined &&
      typeof value.signatureId !== 'string') ||
    !isRecord(value.composer) ||
    !Array.isArray(value.composeAttachments) ||
    !value.composeAttachments.every(isRecoveryAttachment) ||
    !Array.isArray(value.retainedAttachments) ||
    !value.retainedAttachments.every(isRecoveryAttachment) ||
    (value.savedFingerprint !== undefined &&
      typeof value.savedFingerprint !== 'string')
  ) {
    return false;
  }
  const composer = value.composer;
  const quotes = [composer.forwardQuote, composer.removedForwardQuote];
  return (
    quotes.every(
      (quote) =>
        quote === undefined ||
        (isRecord(quote) &&
          ['id', 'accountId', 'html', 'text'].every(
            (field) => typeof quote[field] === 'string',
          ) &&
          Array.isArray(quote.attachments) &&
          quote.attachments.every(isRecoveryAttachment)),
    ) &&
    ['new', 'reply', 'forward', 'edit'].includes(String(composer.mode)) &&
    ['relatedMessageId', 'draftMessageId', 'fromAddress'].every(
      (field) =>
        composer[field] === undefined || typeof composer[field] === 'string',
    ) &&
    ['to', 'cc', 'bcc', 'subject', 'text', 'html', 'scheduledAt'].every(
      (field) => typeof composer[field] === 'string',
    )
  );
}

function isRecoveryAttachment(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.contentType === 'string' &&
    typeof value.size === 'number' &&
    Number.isFinite(value.size) &&
    value.size >= 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function findProviderCapabilities(
  account: MailAccountView | undefined,
  providers: readonly MailProviderView[],
): MailProviderCapabilities | undefined {
  if (!account) return undefined;
  return providers.find(
    (provider) =>
      provider.type === account.provider.type &&
      provider.name === account.provider.name,
  )?.capabilities;
}

export function formatIdentity(identity: MailIdentity): string {
  return identity.displayName
    ? `${identity.displayName} <${identity.address}>`
    : identity.address;
}

export function localDateTimeMinimum(): string {
  const now = new Date(Date.now() + 60_000);
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAddressList(
  addresses: readonly { address: string; name?: string }[],
): string {
  return addresses.map((address) => address.address).join(', ');
}
