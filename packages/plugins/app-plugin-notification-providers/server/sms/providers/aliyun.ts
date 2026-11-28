import { createHmac, randomUUID } from 'node:crypto';

import type { ChannelConfigSummaryItem } from '@nocobase/app-plugin-notification';

import { validateHttpUrl } from '../../http.js';
import { maskedSecret } from '../../summary.js';
import { SmsProviderError, type SmsErrorCode } from '../errors.js';
import { field, postToProvider, refusalCode, text } from '../http.js';
import type {
  SmsProvider,
  SmsProviderDefinition,
  SmsSendInput,
  SmsSendReceipt,
} from '../provider.js';

export interface AliyunSmsOptions {
  readonly accessKeyId: string;
  readonly accessKeySecret: string;
  /** The API host. Defaults to `dysmsapi.aliyuncs.com`. */
  readonly endpoint?: string;
  readonly regionId?: string;
}

const DEFAULT_ENDPOINT = 'dysmsapi.aliyuncs.com';

/** RFC 3986 percent-encoding, which Alibaba Cloud's RPC signature requires. */
export function aliyunPercentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** The RPC signature (HMAC-SHA1, signature version 1.0) of a request's parameters. */
export function aliyunSignature(
  method: string,
  parameters: Readonly<Record<string, string>>,
  accessKeySecret: string,
): string {
  const canonical = Object.keys(parameters)
    .sort()
    .map(
      (key) =>
        `${aliyunPercentEncode(key)}=${aliyunPercentEncode(parameters[key])}`,
    )
    .join('&');
  const stringToSign = `${method}&${aliyunPercentEncode('/')}&${aliyunPercentEncode(canonical)}`;
  return createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64');
}

/** Alibaba Cloud's national format for mainland numbers, and the country code and number without `+` otherwise. */
export function aliyunPhone(phone: string): string {
  const digits = phone.replace(/^\+/, '');
  return /^86\d{11}$/.test(digits) ? digits.slice(2) : digits;
}

/** Alibaba Cloud's documented SMS error codes, by the stable code they map to. */
const ALIYUN_CODES: Readonly<Record<string, SmsErrorCode>> = {
  'isv.SMS_SIGNATURE_ILLEGAL': 'SMS_SIGNATURE_INVALID',
  'isv.SMS_SIGN_ILLEGAL': 'SMS_SIGNATURE_INVALID',
  'isv.SIGN_NAME_ILLEGAL': 'SMS_SIGNATURE_INVALID',
  'isv.SMS_TEMPLATE_ILLEGAL': 'SMS_TEMPLATE_INVALID',
  'isv.TEMPLATE_MISSING_PARAMETERS': 'SMS_PARAMS_INVALID',
  'isv.TEMPLATE_PARAMS_ILLEGAL': 'SMS_PARAMS_INVALID',
  'isv.PARAM_LENGTH_LIMIT': 'SMS_PARAMS_INVALID',
  'isv.PARAM_NOT_SUPPORT_URL': 'SMS_PARAMS_INVALID',
  'isv.MOBILE_NUMBER_ILLEGAL': 'SMS_INVALID_PHONE',
  'isv.INVALID_PARAMETERS': 'SMS_INVALID_PHONE',
  'isv.BLACK_KEY_CONTROL_LIMIT': 'SMS_INVALID_PHONE',
  'isv.AMOUNT_NOT_ENOUGH': 'SMS_INSUFFICIENT_BALANCE',
  'isv.OUT_OF_SERVICE': 'SMS_INSUFFICIENT_BALANCE',
  'isv.BUSINESS_LIMIT_CONTROL': 'SMS_RATE_LIMITED',
  'isv.DAY_LIMIT_CONTROL': 'SMS_RATE_LIMITED',
  'isv.MONTH_LIMIT_CONTROL': 'SMS_RATE_LIMITED',
  'isv.MOBILE_COUNT_OVER_LIMIT': 'SMS_RATE_LIMITED',
  'isv.SMS_TEST_SIGN_TEMPLATE_LIMIT': 'SMS_RATE_LIMITED',
  'isv.ACCOUNT_NOT_EXISTS': 'SMS_AUTH_FAILED',
  'isv.ACCOUNT_ABNORMAL': 'SMS_AUTH_FAILED',
  'isp.RAM_PERMISSION_DENY': 'SMS_AUTH_FAILED',
  'isp.SYSTEM_ERROR': 'SMS_PROVIDER_UNAVAILABLE',
  'isv.SYSTEM_ERROR': 'SMS_PROVIDER_UNAVAILABLE',
  'isp.UNKNOWN_ERROR': 'SMS_PROVIDER_UNAVAILABLE',
  SignatureDoesNotMatch: 'SMS_AUTH_FAILED',
  MissingAccessKeyId: 'SMS_AUTH_FAILED',
};

/** Maps an Alibaba Cloud `Code` to a stable error code; a code it does not know is `SMS_REJECTED`. */
export function aliyunErrorCode(code: string): SmsErrorCode {
  const known = ALIYUN_CODES[code];
  if (known) return known;
  if (
    /^(InvalidAccessKeyId|Forbidden|InvalidSecurityToken|SecurityToken)/.test(
      code,
    )
  )
    return 'SMS_AUTH_FAILED';
  if (/^Throttling/.test(code)) return 'SMS_RATE_LIMITED';
  if (/^(ServiceUnavailable|InternalError)/.test(code))
    return 'SMS_PROVIDER_UNAVAILABLE';
  return 'SMS_REJECTED';
}

export interface AliyunDependencies {
  readonly now?: () => Date;
  readonly nonce?: () => string;
}

export function createAliyunSmsProvider(
  options: AliyunSmsOptions,
  dependencies: AliyunDependencies = {},
): SmsProvider {
  const now = dependencies.now ?? (() => new Date());
  const nonce = dependencies.nonce ?? randomUUID;
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  return {
    async send(input: SmsSendInput): Promise<SmsSendReceipt> {
      const parameters: Record<string, string> = {
        AccessKeyId: options.accessKeyId,
        Action: 'SendSms',
        Format: 'JSON',
        PhoneNumbers: aliyunPhone(input.phone),
        SignName: input.signName,
        SignatureMethod: 'HMAC-SHA1',
        SignatureNonce: nonce(),
        SignatureVersion: '1.0',
        TemplateCode: input.templateId,
        TemplateParam: JSON.stringify(input.params),
        Timestamp: now()
          .toISOString()
          .replace(/\.\d{3}Z$/, 'Z'),
        Version: '2017-05-25',
        ...(options.regionId ? { RegionId: options.regionId } : {}),
      };
      const signature = aliyunSignature(
        'POST',
        parameters,
        options.accessKeySecret,
      );
      const body = [...Object.entries(parameters), ['Signature', signature]]
        .map(
          ([key, value]) =>
            `${aliyunPercentEncode(key)}=${aliyunPercentEncode(value)}`,
        )
        .join('&');
      const response = await postToProvider(`https://${endpoint}/`, {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: input.signal,
      });
      const code = text(field(response.body, 'Code'));
      const requestId = text(field(response.body, 'RequestId'));
      if (code === 'OK')
        return { messageId: text(field(response.body, 'BizId')) };
      throw new SmsProviderError(
        refusalCode(code ? aliyunErrorCode(code) : undefined, response.status),
        {
          providerCode: code ?? `HTTP-${response.status}`,
          requestId,
          retryAfterMs: response.retryAfterMs,
        },
      );
    },
  };
}

function requireText(
  options: Record<string, unknown>,
  key: string,
  path: string,
): string {
  const value = options[key];
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${path}.${key} is required.`);
  return value;
}

export const aliyunSmsService: SmsProviderDefinition<AliyunSmsOptions> = {
  service: 'aliyun',
  label: 'Alibaba Cloud SMS',
  validate(options) {
    const record = options as Record<string, unknown>;
    requireText(record, 'accessKeyId', 'aliyun');
    requireText(record, 'accessKeySecret', 'aliyun');
    if (record.endpoint !== undefined) {
      if (typeof record.endpoint !== 'string')
        throw new Error('aliyun.endpoint must be a host name.');
      validateHttpUrl(`https://${record.endpoint}/`, {
        allowedHosts: ['aliyuncs.com'],
      });
    }
  },
  summarize(options): readonly ChannelConfigSummaryItem[] {
    const record = options as Record<string, unknown>;
    return [
      { label: 'aliyun.accessKeyId', value: maskedSecret(record.accessKeyId) },
      {
        label: 'aliyun.accessKeySecret',
        value: maskedSecret(record.accessKeySecret),
      },
      {
        label: 'aliyun.endpoint',
        value:
          typeof record.endpoint === 'string'
            ? record.endpoint
            : DEFAULT_ENDPOINT,
      },
    ];
  },
  create: (options) => createAliyunSmsProvider(options),
};
