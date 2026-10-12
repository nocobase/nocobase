import { mailErrorCode as providerErrorCode } from './error.js';
import {
  Resend,
  type Response as ResendResponse,
  type ErrorResponse,
} from 'resend';
import { MailExecutions } from './execution.js';
import { validateResendProviderConfig } from './config.js';
import type {
  EmailMessage,
  MailResult,
  MailError,
  MailSendOptions,
  MailTransport,
  ResendProviderConfig,
} from './types.js';

/** The SDK's default error handler prints provider bodies in development. */
class PrivateResend extends Resend {
  public override async fetchRequest<T>(
    path: string,
    options?: RequestInit,
  ): Promise<ResendResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, options);
      if (!response.ok) {
        const error = (await response.json()) as ErrorResponse;
        return {
          data: null,
          error: { ...error, statusCode: response.status },
          headers: null,
        };
      }
      return { data: (await response.json()) as T, error: null, headers: null };
    } catch {
      return {
        data: null,
        error: {
          name: 'application_error',
          statusCode: null,
          message: 'Resend request failed.',
        },
        headers: null,
      };
    }
  }
}

export function createResendTransport(
  config: ResendProviderConfig,
): MailTransport {
  validateResendProviderConfig(config);
  const client = new PrivateResend(config.apiKey);
  const executions = new MailExecutions();
  return {
    async send(
      message: EmailMessage,
      options: MailSendOptions = {},
    ): Promise<MailResult> {
      const execution = executions.submit(
        async (deadline): Promise<MailResult> => {
          const requestOptions = {
            idempotencyKey: options.idempotencyKey,
            signal: options.signal
              ? AbortSignal.any([options.signal, deadline])
              : deadline,
          };
          try {
            const result = await client.emails.send(
              {
                from: message.from ?? config.from,
                to:
                  typeof message.to === 'string' ? message.to : [...message.to],
                subject: message.subject,
                text: message.text ?? '',
                html: message.html,
                replyTo: message.replyTo ?? config.replyTo,
              },
              requestOptions,
            );
            if (!result.error)
              return { status: 'accepted', providerMessageId: result.data.id };
            return resendFailure(result.error);
          } catch (error) {
            return thrownFailure(error);
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

function resendFailure(error: ErrorResponse): MailResult {
  if (error.name === 'application_error' && error.statusCode === null) {
    return {
      status: 'submission_unknown',
      error: {
        code: safeErrorCode(error.name),
        category: 'network',
        message: 'Resend request failed.',
      },
    };
  }
  const category = resendErrorCategory(error);
  return {
    status: 'failed',
    disposition: resendDisposition(error),
    error: {
      code: safeErrorCode(error.name),
      category,
      message: 'Resend request failed.',
    },
  };
}

function resendErrorCategory(error: ErrorResponse): MailError['category'] {
  if (
    error.name === 'rate_limit_exceeded' ||
    error.name === 'monthly_quota_exceeded' ||
    error.name === 'daily_quota_exceeded'
  )
    return 'rate_limit';
  if (
    error.name === 'missing_api_key' ||
    error.name === 'restricted_api_key' ||
    error.name === 'invalid_api_key' ||
    error.name === 'invalid_access' ||
    error.name === 'security_error'
  )
    return 'authentication';
  if (error.name === 'invalid_from_address' || error.name === 'invalid_region')
    return 'configuration';
  if (
    error.name === 'application_error' ||
    error.name === 'internal_server_error'
  )
    return 'provider';
  if (
    error.name === 'validation_error' ||
    error.name === 'invalid_parameter' ||
    error.name === 'missing_required_field' ||
    error.name === 'invalid_attachment' ||
    error.name === 'invalid_idempotency_key' ||
    error.name === 'invalid_idempotent_request'
  )
    return 'content';
  return 'provider';
}

function resendDisposition(error: ErrorResponse): 'never' | 'same_provider' {
  if (error.statusCode === 429 || (error.statusCode ?? 0) >= 500)
    return 'same_provider';
  if (error.name === 'concurrent_idempotent_requests') return 'same_provider';
  return 'never';
}

function thrownFailure(error: unknown): MailResult {
  const message = 'Resend request failed.';
  const code = providerErrorCode(error);
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EPIPE') {
    return {
      status: 'submission_unknown',
      error: { code, category: 'timeout', message },
    };
  }
  return {
    status: 'failed',
    disposition: 'same_provider',
    error: { code, category: 'network', message },
  };
}

const RESEND_ERROR_CODES = new Set<string>([
  'invalid_idempotency_key',
  'validation_error',
  'missing_api_key',
  'restricted_api_key',
  'invalid_api_key',
  'not_found',
  'method_not_allowed',
  'invalid_idempotent_request',
  'concurrent_idempotent_requests',
  'invalid_attachment',
  'invalid_from_address',
  'invalid_access',
  'invalid_parameter',
  'invalid_region',
  'missing_required_field',
  'monthly_quota_exceeded',
  'daily_quota_exceeded',
  'rate_limit_exceeded',
  'security_error',
  'application_error',
  'internal_server_error',
]);

function safeErrorCode(name: string): string | undefined {
  return RESEND_ERROR_CODES.has(name) ? name : undefined;
}
