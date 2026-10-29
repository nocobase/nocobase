import { mailErrorCode as providerErrorCode } from './error.js';
import { connect, type Socket } from 'node:net';
import { connect as connectTls } from 'node:tls';
import nodemailer from 'nodemailer';
import { MailExecutions } from './execution.js';
import { validateSmtpProviderConfig } from './config.js';
import type {
  EmailMessage,
  MailResult,
  MailTransport,
  MailSendOptions,
  SmtpProviderConfig,
} from './types.js';

export function createSmtpTransport(config: SmtpProviderConfig): MailTransport {
  validateSmtpProviderConfig(config);
  const executions = new MailExecutions();
  return {
    async send(
      message: EmailMessage,
      options: MailSendOptions = {},
    ): Promise<MailResult> {
      const execution = executions.submit(
        async (deadline): Promise<MailResult> => {
          const signal = options.signal
            ? AbortSignal.any([deadline, options.signal])
            : deadline;
          let socket: Socket | undefined;
          const cancel = (): void => {
            socket?.destroy(new Error('Mail submission cancelled.'));
          };
          signal.addEventListener('abort', cancel, { once: true });
          const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.auth,
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 20_000,
            logger: false,
            debug: false,
            getSocket(
              _options: unknown,
              callback: (
                error: Error | null,
                options: { connection: Socket; secured: boolean } | undefined,
              ) => void,
            ) {
              if (signal.aborted) {
                callback(new Error('Mail submission cancelled.'), undefined);
                return;
              }
              let supplied = false;
              const connected = (): void => {
                supplied = true;
                callback(null, {
                  connection: socket!,
                  secured: config.secure === true,
                });
              };
              socket = config.secure
                ? connectTls(
                    {
                      host: config.host,
                      port: config.port,
                      servername: config.host,
                    },
                    connected,
                  )
                : connect({ host: config.host, port: config.port }, connected);
              socket.once('error', (error) => {
                if (!supplied) {
                  supplied = true;
                  callback(error, undefined);
                }
              });
              socket.setTimeout(10_000, () =>
                socket?.destroy(
                  Object.assign(new Error('Mail connection timed out.'), {
                    code: 'ETIMEDOUT',
                  }),
                ),
              );
              if (signal.aborted) cancel();
            },
          });
          try {
            const info = await transporter.sendMail({
              from: message.from ?? config.from,
              to: typeof message.to === 'string' ? message.to : [...message.to],
              subject: message.subject,
              text: message.text,
              html: message.html,
              replyTo: message.replyTo ?? config.replyTo,
            });
            return { status: 'accepted', providerMessageId: info.messageId };
          } catch (error) {
            const transportFailure = classifySmtpTransportFailure(error);
            const detail = {
              category:
                transportFailure === 'submission_unknown' &&
                providerErrorCode(error) === 'ETIMEDOUT'
                  ? ('timeout' as const)
                  : smtpErrorCategory(error),
              code: providerErrorCode(error),
              message: 'SMTP delivery failed.',
            };
            if (transportFailure === 'submission_unknown' || signal.aborted)
              return { status: 'submission_unknown', error: detail };
            return {
              status: 'failed',
              error: detail,
              disposition: smtpDisposition(error, transportFailure),
            };
          } finally {
            signal.removeEventListener('abort', cancel);
            socket?.destroy();
            transporter.close();
          }
        },
      );
      return execution
        ? execution.completion
        : {
            status: 'failed',
            disposition: 'never',
            error: {
              category: 'rate_limit',
              message: 'Mail submission capacity unavailable.',
            },
          };
    },
    close: () => executions.close(),
  };
}

function smtpDisposition(
  error: unknown,
  transportFailure: SmtpTransportFailure | undefined,
): 'never' | 'same_provider' {
  const responseCode = smtpResponseCode(error);
  if (responseCode !== undefined) {
    if (responseCode >= 400 && responseCode < 500) return 'same_provider';
    if (responseCode >= 500 && responseCode < 600) return 'never';
  }
  const code = providerErrorCode(error);
  if (code === 'EAUTH' || code === 'EENVELOPE' || code === 'EMESSAGE')
    return 'never';
  if (transportFailure === 'pre_submission') return 'same_provider';
  return 'never';
}

function smtpErrorCategory(
  error: unknown,
): 'authentication' | 'content' | 'network' | 'provider' | 'recipient' {
  const code = providerErrorCode(error);
  if (code === 'EAUTH') return 'authentication';
  if (code === 'EENVELOPE') return 'recipient';
  if (code === 'EMESSAGE') return 'content';
  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    code === 'ESOCKET' ||
    code === 'ECONNECTION'
  )
    return 'network';
  return 'provider';
}

function smtpResponseCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('responseCode' in error))
    return undefined;
  return typeof error.responseCode === 'number'
    ? error.responseCode
    : undefined;
}

type SmtpTransportFailure = 'pre_submission' | 'submission_unknown';

const SMTP_TRANSPORT_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'EPIPE',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ESOCKET',
  'ECONNECTION',
]);

const SMTP_SAFE_RETRY_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

function classifySmtpTransportFailure(
  error: unknown,
): SmtpTransportFailure | undefined {
  if (smtpResponseCode(error) !== undefined) return undefined;
  const code = providerErrorCode(error);
  if (!code || !SMTP_TRANSPORT_ERROR_CODES.has(code)) return undefined;
  return SMTP_SAFE_RETRY_CODES.has(code)
    ? 'pre_submission'
    : 'submission_unknown';
}
