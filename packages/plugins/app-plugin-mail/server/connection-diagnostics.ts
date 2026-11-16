import type { MailProviderError } from '../shared/mail.js';
import { writeMailLog, type MailLogger } from './logging.js';
import type { ImapSmtpEndpointConfig } from './adapters/imap-smtp/config.js';

export type MailFailureStage =
  'dns' | 'connect' | 'tls' | 'greeting' | 'auth' | 'sync' | 'send';
export type MailProtocol = 'imap' | 'smtp' | 'https';

/** Preserve the failing protocol without modifying the SDK error or its payload. */
export class MailConnectionError extends Error {
  public constructor(
    public readonly protocol: MailProtocol,
    cause: unknown,
    public readonly durationMs: number,
    public readonly stage: MailFailureStage = 'connect',
  ) {
    super('Mail connection failed.', { cause });
  }
}

export function errorRecord(error: unknown): Record<string, unknown> {
  return error !== null && typeof error === 'object'
    ? (error as Record<string, unknown>)
    : {};
}

export function connectionCause(error: unknown): unknown {
  return error instanceof MailConnectionError ? error.cause : error;
}

function encodedSecret(secret: string): string {
  try {
    return encodeURIComponent(secret);
  } catch {
    return secret;
  }
}

/** Replace known credentials before truncation, including common protocol encodings. */
export function redactMailText(
  value: unknown,
  secrets: readonly string[] = [],
): string | undefined {
  if (typeof value !== 'string') return undefined;
  let text = value;
  const variants = secrets
    .filter(Boolean)
    .flatMap((secret) => [
      secret,
      encodedSecret(secret),
      Buffer.from(secret).toString('base64'),
    ]);
  for (const secret of variants.sort((a, b) => b.length - a.length))
    text = text.split(secret).join('[REDACTED]');
  return text
    .replace(/(?:https?:\/\/|imaps?:\/\/|smtps?:\/\/)[^\s]+/giu, '[URL]')
    .replace(
      /\b(?:AUTH(?:ENTICATE)?|LOGIN|Bearer|Basic)\s+[^\r\n]*/giu,
      '[REDACTED]',
    )
    .replace(
      /\b(?:password|pass|access_token|refresh_token|client_secret|code_verifier|credentialReference|authorization|code|state)\s*[=:]\s*[^\s,;]+/giu,
      '[REDACTED]',
    )
    .replace(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([A-Z0-9.-]+)/giu, '***@$1')
    .slice(0, 200);
}

export function failureStage(
  error: unknown,
  fallback: MailFailureStage,
): MailFailureStage {
  const value = errorRecord(connectionCause(error));
  const code =
    typeof value.originalCode === 'string'
      ? value.originalCode
      : typeof value.code === 'string'
        ? value.code
        : '';
  if (['ENOTFOUND', 'EAI_AGAIN', 'EDNS'].includes(code)) return 'dns';
  if (
    [
      'ECONNREFUSED',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'ECONNECTION',
      'CONNECT_TIMEOUT',
      'UND_ERR_CONNECT_TIMEOUT',
    ].includes(code)
  )
    return 'connect';
  if (
    isCertificateError(code) ||
    code.startsWith('ERR_SSL_') ||
    code.startsWith('ERR_TLS_') ||
    ['EPROTO', 'ETLS', 'UPGRADE_TIMEOUT'].includes(code)
  )
    return 'tls';
  if (
    code === 'GREETING_TIMEOUT' ||
    (value.command === 'CONN' &&
      /greeting/i.test(typeof value.message === 'string' ? value.message : ''))
  )
    return 'greeting';
  if (
    (typeof value.command === 'string' &&
      /^(?:AUTH(?:ENTICATE)?|LOGIN)(?: |$)/iu.test(value.command)) ||
    value.authenticationFailed === true ||
    code === 'EAUTH' ||
    ['AUTHENTICATIONFAILED', 'AUTHORIZATIONFAILED', 'EXPIRED'].includes(
      typeof value.serverResponseCode === 'string'
        ? value.serverResponseCode
        : '',
    ) ||
    value.responseCode === 535
  )
    return 'auth';
  if (value.command === 'CONN' || value.syscall === 'connect') return 'connect';
  return fallback;
}

export function isCertificateError(code: string): boolean {
  return /^(?:CERT_|ERR_TLS_CERT_|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT)/u.test(
    code,
  );
}

export function isCertificateFailure(value: Record<string, unknown>): boolean {
  return (
    isCertificateError(
      typeof value.originalCode === 'string'
        ? value.originalCode
        : typeof value.code === 'string'
          ? value.code
          : '',
    ) ||
    (value.code === 'ETLS' &&
      typeof value.message === 'string' &&
      /(?:self[- ]signed certificate|certificate (?:has expired|expired)|unable to verify|certificate.*(?:hostname|altnames))/iu.test(
        value.message,
      ))
  );
}

export interface MailFailureContext {
  readonly logger?: MailLogger;
  readonly event: string;
  readonly provider: string;
  readonly accountId?: string;
  readonly address?: string;
  readonly protocol: MailProtocol;
  readonly endpoint?: ImapSmtpEndpointConfig;
  readonly stage: MailFailureStage;
  readonly startedAt: number;
  readonly secrets?: readonly string[];
}

/** Only these scalar fields cross the logging boundary; never copy SDK errors, commands or stacks. */
const reportedConnections = new WeakSet<MailConnectionError>();

export function logMailFailure(
  error: unknown,
  classified: MailProviderError,
  context: MailFailureContext,
): void {
  if (!context.logger) return;
  if (error instanceof MailConnectionError) {
    if (reportedConnections.has(error)) return;
    reportedConnections.add(error);
  }
  const value = errorRecord(connectionCause(error));
  const secrets = context.secrets ?? [];
  const clean = (value: unknown): string | undefined =>
    redactMailText(value, secrets);
  const endpoint = context.endpoint;
  writeMailLog(
    context.logger,
    'warn',
    {
      event: context.event,
      provider: context.provider,
      accountId: context.accountId,
      address: redactMailText(context.address),
      protocol:
        error instanceof MailConnectionError
          ? error.protocol
          : context.protocol,
      ...(endpoint
        ? {
            host: endpoint.host,
            port: endpoint.port,
            secure: endpoint.secure,
            // Both SDKs opportunistically upgrade when implicit TLS is disabled.
            starttls: endpoint.secure ? 'disabled' : 'opportunistic',
            rejectUnauthorized: endpoint.rejectUnauthorized ?? true,
          }
        : {}),
      stage: failureStage(
        error,
        classified.category === 'authentication'
          ? 'auth'
          : error instanceof MailConnectionError
            ? error.stage
            : context.stage,
      ),
      durationMs:
        error instanceof MailConnectionError
          ? error.durationMs
          : Math.max(0, Date.now() - context.startedAt),
      code: clean(value.originalCode ?? value.code ?? classified.code),
      transportCode: clean(value.code),
      errno: typeof value.errno === 'number' ? value.errno : clean(value.errno),
      syscall: clean(value.syscall),
      serverResponseCode: clean(value.serverResponseCode),
      responseCode:
        typeof value.responseCode === 'number' ? value.responseCode : undefined,
      responseText: clean(value.responseText ?? value.response),
      message: clean(value.message ?? classified.message),
      category: classified.category,
      retryable: classified.retryable,
      reasonCode: clean(classified.reasonCode),
    },
    'Mail provider operation failed.',
  );
}
