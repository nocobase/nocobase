import { AsyncLocalStorage } from 'node:async_hooks';
import { connect as connectNet, isIP, type Socket } from 'node:net';
import { connect as connectTls } from 'node:tls';
import {
  type SendingProviderDefinition,
  type ProviderSendResult,
} from '../../types.js';

import {
  providerErrorCode,
  sanitizeProviderErrorMessage,
} from '../../error.js';
import type { PreparedEmailMessage, SmtpProviderConfig } from '../types.js';

export function defineSmtpProviderConfig(
  input: Omit<SmtpProviderConfig, 'provider'>,
): SmtpProviderConfig {
  return { provider: 'smtp', ...input };
}

export function createSmtpProviderDefinition(): SendingProviderDefinition<
  SmtpProviderConfig,
  PreparedEmailMessage
> {
  return {
    type: 'smtp',
    messageType: 'email',
    validateConfig: validateSmtpProviderConfig,
    async createProvider(_context, config) {
      validateSmtpProviderConfig(config);
      const { default: nodemailer } = await import('nodemailer');
      const requests = new AsyncLocalStorage<{
        signal: AbortSignal;
        sockets: Set<Socket>;
      }>();
      const sockets = new Set<Socket>();
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        connectionTimeout: 20_000,
        greetingTimeout: 20_000,
        socketTimeout: 20_000,
        getSocket(
          _options: unknown,
          callback: (
            error: Error | null,
            options?: { connection: Socket; secured: boolean },
          ) => void,
        ) {
          const request = requests.getStore();
          if (!request || request.signal.aborted) {
            callback(
              Object.assign(new Error('SMTP submission aborted.'), {
                code: 'ETIMEDOUT',
              }),
            );
            return;
          }
          // Own the socket so an overall deadline terminates every SMTP phase,
          // including DATA, rather than merely ignoring a late response.
          const socket = config.secure
            ? connectTls({
                host: config.host,
                port: config.port,
                servername: isIP(config.host) ? undefined : config.host,
              })
            : connectNet({ host: config.host, port: config.port });
          sockets.add(socket);
          request.sockets.add(socket);
          let supplied = false;
          const abort = (): void => {
            socket.destroy(
              Object.assign(new Error('SMTP submission aborted.'), {
                code: 'ETIMEDOUT',
              }),
            );
          };
          request.signal.addEventListener('abort', abort, { once: true });
          socket.once('close', () => {
            sockets.delete(socket);
            request.sockets.delete(socket);
            request.signal.removeEventListener('abort', abort);
          });
          socket.once('error', (error: Error) => {
            if (!supplied) {
              supplied = true;
              callback(error);
            }
          });
          socket.once(config.secure ? 'secureConnect' : 'connect', () => {
            if (!supplied) {
              supplied = true;
              callback(null, {
                connection: socket,
                secured: config.secure ?? false,
              });
            }
          });
          if (request.signal.aborted) abort();
        },
      });
      return {
        type: 'smtp',
        async send({ message, signal }): Promise<ProviderSendResult> {
          const request = { signal, sockets: new Set<Socket>() };
          try {
            const info = await requests.run(request, () =>
              transporter.sendMail({
                from: message.content.from ?? config.from,
                to: message.to,
                subject: message.content.subject,
                text: message.content.text,
                html: message.content.html,
                replyTo: message.content.replyTo ?? config.replyTo,
              }),
            );
            return {
              status: 'accepted',
              providerMessageId: info.messageId,
            };
          } catch (error) {
            const transportFailure = classifySmtpTransportFailure(error);
            if (transportFailure === 'submission_unknown') {
              return {
                status: 'submission_unknown',
                error: {
                  category:
                    providerErrorCode(error) === 'ETIMEDOUT'
                      ? 'timeout'
                      : 'network',
                  code: providerErrorCode(error),
                  message: sanitizeProviderErrorMessage(
                    error,
                    'SMTP transport failed.',
                  ),
                },
              };
            }
            return {
              status: 'failed',
              error: {
                category: smtpErrorCategory(error),
                code: providerErrorCode(error),
                message: sanitizeProviderErrorMessage(
                  error,
                  'SMTP delivery failed.',
                ),
              },
              disposition: smtpDisposition(error, transportFailure),
            };
          } finally {
            for (const socket of request.sockets) socket.destroy();
          }
        },
        async close(): Promise<void> {
          for (const socket of sockets) socket.destroy();
          transporter.close();
        },
      };
    },
  };
}

function validateSmtpProviderConfig(config: SmtpProviderConfig): void {
  if (!config.host.trim()) throw new Error('SMTP host is required.');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
    throw new Error('SMTP port must be an integer between 1 and 65535.');
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
