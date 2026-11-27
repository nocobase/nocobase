import type { MailProviderResult } from '../../shared/mail.js';
import type { MailOriginalMessageContent } from '../contracts/provider.js';

export function originalMessageTooLarge(): MailProviderResult<never> {
  return {
    ok: false,
    error: {
      code: 'MAIL_ORIGINAL_TOO_LARGE',
      message: 'The original message exceeds the download size limit.',
      category: 'provider',
      retryable: false,
    },
  };
}

export function originalMessageMissing(): MailProviderResult<never> {
  return {
    ok: false,
    error: {
      code: 'MAIL_ORIGINAL_NOT_FOUND',
      message: 'The original message is no longer available at the provider.',
      category: 'provider',
      retryable: false,
    },
  };
}

export function originalMessageBytes(
  bytes: Uint8Array,
): MailOriginalMessageContent {
  return {
    size: bytes.byteLength,
    stream: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
  };
}
