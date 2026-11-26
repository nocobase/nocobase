import {
  canHaveOriginalMessage,
  MAIL_ORIGINAL_MAX_BYTES,
  originalMessageFileName,
} from '../../shared/original-message.js';
import type {
  MailAttachmentContent,
  MailOperationContext,
  MailProviderError,
} from '../../shared/mail.js';
import type {
  MailOriginalMessageContent,
  MailProviderAdapter,
} from '../contracts/provider.js';
import { requireOwnedMessage } from './access.js';
import type { MailServiceDependencies } from './dependencies.js';
import {
  MailError,
  MailProviderRequestError,
  mailFailedPrecondition,
  mailNotFound,
} from './errors.js';
import { closeAdapter } from './provider-lifecycle.js';

const ORIGINAL_DOWNLOAD_TIMEOUT_MS = 60_000;

export async function openOriginalMessage(
  dependencies: MailServiceDependencies<
    'getAccount' | 'getMessage',
    'adapters'
  >,
  context: MailOperationContext,
  accountId: string,
  messageId: string,
): Promise<MailAttachmentContent> {
  const deadline = AbortSignal.timeout(ORIGINAL_DOWNLOAD_TIMEOUT_MS);
  const signal = context.signal
    ? AbortSignal.any([context.signal, deadline])
    : deadline;
  const { account, message } = await requireOwnedMessage(
    dependencies.store,
    context,
    accountId,
    messageId,
  );
  if (!canHaveOriginalMessage(message.providerMessageId))
    throw unsupportedOriginal();

  let adapter: MailProviderAdapter | undefined;
  try {
    signal.throwIfAborted();
    adapter = await dependencies.adapters.resolve(account, signal);
    signal.throwIfAborted();
    if (!adapter.capabilities.downloadOriginal || !adapter.getOriginalMessage)
      throw unsupportedOriginal();

    const result = await adapter.getOriginalMessage(
      message.providerMessageId,
      signal,
    );
    if (!result.ok) throw originalError(result.error);
    const content = result.value;
    const { size } = content;
    if (
      signal.aborted ||
      (size !== undefined &&
        (!Number.isSafeInteger(size) ||
          size < 1 ||
          size > MAIL_ORIGINAL_MAX_BYTES))
    ) {
      await content.stream.cancel().catch(() => {});
      signal.throwIfAborted();
      if (size !== undefined && size > MAIL_ORIGINAL_MAX_BYTES)
        throw originalTooLarge();
      throw originalError();
    }
    const fileName = originalMessageFileName(message.subject);
    const openedAdapter = adapter;
    return {
      fileName,
      contentType: 'message/rfc822',
      size,
      stream: boundOriginalStream(content, signal, () =>
        closeAdapter(openedAdapter),
      ),
    };
  } catch (error) {
    if (adapter) await closeAdapter(adapter);
    if (signal.aborted) throw originalError();
    if (error instanceof MailError || error instanceof MailProviderRequestError)
      throw error;
    throw originalError();
  }
}

function unsupportedOriginal(): MailError {
  return mailFailedPrecondition(
    'MAIL_PROVIDER_OPERATION_UNSUPPORTED',
    'The original is not available for this message.',
  );
}

function originalTooLarge(): MailError {
  return mailFailedPrecondition(
    'MAIL_ORIGINAL_TOO_LARGE',
    'The original message exceeds the download size limit.',
  );
}

function originalError(
  error?: MailProviderError,
): MailError | MailProviderRequestError {
  if (error?.code === 'MAIL_ORIGINAL_NOT_FOUND')
    return mailNotFound(
      'MAIL_ORIGINAL_NOT_FOUND',
      'The original message is no longer available at the provider.',
      'messageId',
    );
  if (error?.code === 'MAIL_ORIGINAL_TOO_LARGE') return originalTooLarge();
  // Only the category and delay are needed here. Provider text and codes can contain remote data.
  const category =
    error?.category === 'authentication' || error?.category === 'rate_limit'
      ? error.category
      : 'network';
  const retryAfterMs = error?.retryAfterMs;
  return new MailProviderRequestError({
    code: 'MAIL_ORIGINAL_PROVIDER_FAILED',
    message: 'The original message could not be downloaded from the provider.',
    category,
    retryable: category !== 'authentication' || error?.retryable === true,
    retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
  });
}

/** Keep backpressure and hold the final known-length chunk until the provider ends cleanly. */
function boundOriginalStream(
  { stream, size }: MailOriginalMessageContent,
  signal: AbortSignal,
  close: () => Promise<void>,
): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  let total = 0;
  let finished = false;
  let abort: () => void;

  const finish = async (cancel: boolean): Promise<void> => {
    if (finished) return;
    finished = true;
    signal.removeEventListener('abort', abort);
    // Cancel with our own reason, never pass an HTTP or provider error into another layer.
    const cancellation = cancel ? reader.cancel().catch(() => {}) : undefined;
    reader.releaseLock();
    await close();
    await cancellation;
  };

  return new ReadableStream<Uint8Array>(
    {
      start(controller) {
        abort = () => {
          controller.error(downloadInterrupted());
          void finish(true);
        };
        if (signal.aborted) abort();
        else signal.addEventListener('abort', abort, { once: true });
      },
      async pull(controller) {
        try {
          const result = await reader.read();
          if (finished) return;
          if (result.done) {
            if (total === 0 || (size !== undefined && total !== size))
              throw downloadInterrupted();
            controller.close();
            await finish(false);
            return;
          }
          total += result.value.byteLength;
          if (total > (size ?? MAIL_ORIGINAL_MAX_BYTES))
            throw downloadInterrupted();
          if (size !== undefined && total === size) {
            if (!(await reader.read()).done) throw downloadInterrupted();
            if (finished) return;
            controller.enqueue(result.value);
            controller.close();
            await finish(false);
          } else {
            controller.enqueue(result.value);
          }
        } catch {
          if (finished) return;
          controller.error(downloadInterrupted());
          await finish(true);
        }
      },
      cancel: () => finish(true),
    },
    { highWaterMark: 0 },
  );
}

function downloadInterrupted(): Error {
  return new Error('Original message download was interrupted.');
}
