import { createHash, createHmac } from 'node:crypto';

import type { ChannelConfigSummaryItem } from '@nocobase/app-plugin-notification';

import { validateHttpUrl } from '../../http.js';
import { maskedSecret } from '../../summary.js';
import { SmsProviderError, type SmsErrorCode } from '../errors.js';
import { field, postToProvider, text } from '../http.js';
import type {
  SmsProvider,
  SmsProviderDefinition,
  SmsSendInput,
  SmsSendReceipt,
} from '../provider.js';

export interface TencentSmsOptions {
  readonly secretId: string;
  readonly secretKey: string;
  /** The SMS application's SDK app id. */
  readonly sdkAppId: string | number;
  /** Defaults to `ap-guangzhou`. */
  readonly region?: string;
  /** The API host. Defaults to `sms.tencentcloudapi.com`. */
  readonly endpoint?: string;
}

const DEFAULT_ENDPOINT = 'sms.tencentcloudapi.com';
const DEFAULT_REGION = 'ap-guangzhou';
const SERVICE = 'sms';
const SIGNED_HEADERS = 'content-type;host;x-tc-action';

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
const hmac = (key: string | Buffer, value: string): Buffer =>
  createHmac('sha256', key).update(value).digest();

/** The `Authorization` header of a TC3-HMAC-SHA256 request to the SMS API. */
export function tencentAuthorization(input: {
  readonly secretId: string;
  readonly secretKey: string;
  readonly host: string;
  readonly action: string;
  readonly payload: string;
  readonly timestamp: number;
}): string {
  const date = new Date(input.timestamp * 1000).toISOString().slice(0, 10);
  const canonicalRequest = [
    'POST',
    '/',
    '',
    `content-type:application/json; charset=utf-8\nhost:${input.host}\nx-tc-action:${input.action.toLowerCase()}\n`,
    SIGNED_HEADERS,
    sha256(input.payload),
  ].join('\n');
  const scope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = [
    'TC3-HMAC-SHA256',
    String(input.timestamp),
    scope,
    sha256(canonicalRequest),
  ].join('\n');
  const signingKey = hmac(
    hmac(hmac(`TC3${input.secretKey}`, date), SERVICE),
    'tc3_request',
  );
  const signature = createHmac('sha256', signingKey)
    .update(stringToSign)
    .digest('hex');
  return `TC3-HMAC-SHA256 Credential=${input.secretId}/${scope}, SignedHeaders=${SIGNED_HEADERS}, Signature=${signature}`;
}

/** Maps a Tencent Cloud error code to a stable error code. */
export function tencentErrorCode(code: string): SmsErrorCode {
  if (/^AuthFailure|^UnauthorizedOperation|^InvalidCredential/i.test(code))
    return 'SMS_AUTH_FAILED';
  if (/Signature|SignName/i.test(code)) return 'SMS_SIGNATURE_INVALID';
  if (/TemplateParam|ParameterFormat/i.test(code)) return 'SMS_PARAMS_INVALID';
  if (/Template/i.test(code)) return 'SMS_TEMPLATE_INVALID';
  if (/Phone|Mobile/i.test(code) && !/Limit/i.test(code))
    return 'SMS_INVALID_PHONE';
  if (/Insufficient|Balance|Arrear/i.test(code))
    return 'SMS_INSUFFICIENT_BALANCE';
  if (/^LimitExceeded|^RequestLimitExceeded|Frequency|Limit/i.test(code))
    return 'SMS_RATE_LIMITED';
  if (
    /^InternalError|^ServiceUnavailable|^FailedOperation\.Timeout|^UnknownError/i.test(
      code,
    )
  )
    return 'SMS_PROVIDER_UNAVAILABLE';
  return 'SMS_REJECTED';
}

export interface TencentDependencies {
  /** Seconds since the epoch. */
  readonly now?: () => number;
}

export function createTencentSmsProvider(
  options: TencentSmsOptions,
  dependencies: TencentDependencies = {},
): SmsProvider {
  const now = dependencies.now ?? (() => Math.floor(Date.now() / 1000));
  const host = options.endpoint ?? DEFAULT_ENDPOINT;
  return {
    async send(input: SmsSendInput): Promise<SmsSendReceipt> {
      // Tencent Cloud fills a template's variables by position, so the mapped order is the template's order.
      const payload = JSON.stringify({
        PhoneNumberSet: [input.phone],
        SmsSdkAppId: String(options.sdkAppId),
        SignName: input.signName,
        TemplateId: input.templateId,
        TemplateParamSet: Object.values(input.params),
      });
      const timestamp = now();
      const response = await postToProvider(`https://${host}/`, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          host,
          'x-tc-action': 'SendSms',
          'x-tc-version': '2021-01-11',
          'x-tc-timestamp': String(timestamp),
          'x-tc-region': options.region ?? DEFAULT_REGION,
          authorization: tencentAuthorization({
            secretId: options.secretId,
            secretKey: options.secretKey,
            host,
            action: 'SendSms',
            payload,
            timestamp,
          }),
        },
        body: payload,
        signal: input.signal,
      });
      const result = field(response.body, 'Response');
      const requestId = text(field(result, 'RequestId'));
      const failure = field(result, 'Error');
      if (failure || !result) {
        const code = text(field(failure, 'Code')) ?? `HTTP ${response.status}`;
        const mapped = tencentErrorCode(code);
        throw new SmsProviderError(mapped, {
          providerCode: code,
          requestId,
          retryAfterMs: response.retryAfterMs,
          detail:
            mapped === 'SMS_REJECTED'
              ? text(field(failure, 'Message'))
              : undefined,
        });
      }
      const statuses = field(result, 'SendStatusSet');
      const status: unknown = Array.isArray(statuses) ? statuses[0] : undefined;
      const code = text(field(status, 'Code'));
      if (code?.toLowerCase() === 'ok')
        return { messageId: text(field(status, 'SerialNo')) };
      const providerCode = code ?? 'MISSING_STATUS';
      const mapped = tencentErrorCode(providerCode);
      throw new SmsProviderError(mapped, {
        providerCode,
        requestId,
        detail:
          mapped === 'SMS_REJECTED'
            ? text(field(status, 'Message'))
            : undefined,
      });
    },
  };
}

export const tencentSmsService: SmsProviderDefinition<TencentSmsOptions> = {
  service: 'tencent',
  label: 'Tencent Cloud SMS',
  validate(options) {
    const record = options as Record<string, unknown>;
    for (const key of ['secretId', 'secretKey', 'sdkAppId'])
      if (
        (typeof record[key] !== 'string' && typeof record[key] !== 'number') ||
        !String(record[key]).trim()
      )
        throw new Error(`tencent.${key} is required.`);
    if (record.endpoint !== undefined) {
      if (typeof record.endpoint !== 'string')
        throw new Error('tencent.endpoint must be a host name.');
      validateHttpUrl(`https://${record.endpoint}/`, {
        allowedHosts: ['tencentcloudapi.com'],
      });
    }
  },
  summarize(options): readonly ChannelConfigSummaryItem[] {
    const record = options as Record<string, unknown>;
    return [
      { label: 'tencent.secretId', value: maskedSecret(record.secretId) },
      { label: 'tencent.secretKey', value: maskedSecret(record.secretKey) },
      {
        label: 'tencent.sdkAppId',
        value:
          typeof record.sdkAppId === 'string' ||
          typeof record.sdkAppId === 'number'
            ? String(record.sdkAppId)
            : 'not set',
      },
      {
        label: 'tencent.region',
        value:
          typeof record.region === 'string' ? record.region : DEFAULT_REGION,
      },
    ];
  },
  create: (options) => createTencentSmsProvider(options),
};
