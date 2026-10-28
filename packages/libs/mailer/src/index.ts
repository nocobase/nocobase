import type {
  EmailChannelConfig,
  MailTransport,
  MailTransportOptions,
} from './types.js';
import { createSmtpTransport } from './smtp.js';
import { createResendTransport } from './resend.js';

export * from './types.js';
export * from './config.js';
export * from './execution.js';
export { createSmtpTransport, createResendTransport };

export function createMailTransport(
  config: EmailChannelConfig,
  options: MailTransportOptions = {},
): MailTransport {
  return config.provider === 'smtp'
    ? createSmtpTransport(config, options)
    : createResendTransport(config);
}
