import { createHash, createHmac } from 'node:crypto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SmsProviderError,
  aliyunErrorCode,
  aliyunPercentEncode,
  aliyunPhone,
  createAliyunSmsProvider,
  createTencentSmsProvider,
  tencentAuthorization,
  tencentErrorCode,
  type SmsErrorCode,
} from '../server/sms/index.js';

afterEach(() => vi.unstubAllGlobals());

const signal = new AbortController().signal;
const send = {
  phone: '+8613800138000',
  templateId: 'SMS_123',
  params: { code: '246810' },
  signName: 'Example',
  signal,
};

function stubFetch(response: Response | Error) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

function bodyParameters(fetch: ReturnType<typeof stubFetch>) {
  return new URLSearchParams(String(fetch.mock.calls[0]![1]!.body));
}

describe('Alibaba Cloud SMS', () => {
  const provider = createAliyunSmsProvider(
    { accessKeyId: 'LTAIexample', accessKeySecret: 'aliyun-secret-value' },
    {
      now: () => new Date('2026-11-25T10:00:00.123Z'),
      nonce: () => 'nonce-1',
    },
  );

  it('signs a SendSms call with the RPC HMAC-SHA1 signature', async () => {
    const fetch = stubFetch(
      Response.json({ Code: 'OK', BizId: 'biz-1', RequestId: 'req-1' }),
    );
    await expect(provider.send(send)).resolves.toEqual({ messageId: 'biz-1' });

    expect(fetch.mock.calls[0]![0]).toBe('https://dysmsapi.aliyuncs.com/');
    expect(fetch.mock.calls[0]![1]).toMatchObject({
      method: 'POST',
      redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    const parameters = bodyParameters(fetch);
    expect(Object.fromEntries(parameters)).toMatchObject({
      Action: 'SendSms',
      Version: '2017-05-25',
      AccessKeyId: 'LTAIexample',
      PhoneNumbers: '13800138000',
      SignName: 'Example',
      TemplateCode: 'SMS_123',
      TemplateParam: '{"code":"246810"}',
      Timestamp: '2026-11-25T10:00:00Z',
      SignatureNonce: 'nonce-1',
    });
    // Rebuild the signature the way Alibaba Cloud documents it, independently of the implementation.
    const signature = parameters.get('Signature');
    parameters.delete('Signature');
    const encode = (value: string): string =>
      encodeURIComponent(value).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
      );
    const canonical = [...parameters.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, value]) => `${encode(key)}=${encode(value)}`)
      .join('&');
    expect(signature).toBe(
      createHmac('sha1', 'aliyun-secret-value&')
        .update(`POST&%2F&${encode(canonical)}`)
        .digest('base64'),
    );
  });

  it('never puts the secret in the request', async () => {
    const fetch = stubFetch(Response.json({ Code: 'OK' }));
    await provider.send(send);
    expect(JSON.stringify(fetch.mock.calls)).not.toContain(
      'aliyun-secret-value',
    );
  });

  it('percent-encodes the characters Alibaba Cloud treats as reserved', () => {
    expect(aliyunPercentEncode("x!y'z(1)*~ +")).toBe(
      'x%21y%27z%281%29%2A~%20%2B',
    );
  });

  it('writes mainland numbers in the national form and others without the plus', () => {
    expect(aliyunPhone('+8613800138000')).toBe('13800138000');
    expect(aliyunPhone('+85212345678')).toBe('85212345678');
  });

  it.each<[string, SmsErrorCode]>([
    ['isv.SMS_SIGNATURE_ILLEGAL', 'SMS_SIGNATURE_INVALID'],
    ['isv.SMS_TEMPLATE_ILLEGAL', 'SMS_TEMPLATE_INVALID'],
    ['isv.TEMPLATE_MISSING_PARAMETERS', 'SMS_PARAMS_INVALID'],
    ['isv.TEMPLATE_PARAMS_ILLEGAL', 'SMS_PARAMS_INVALID'],
    ['isv.MOBILE_NUMBER_ILLEGAL', 'SMS_INVALID_PHONE'],
    ['isv.BUSINESS_LIMIT_CONTROL', 'SMS_RATE_LIMITED'],
    ['isv.DAY_LIMIT_CONTROL', 'SMS_RATE_LIMITED'],
    ['isv.AMOUNT_NOT_ENOUGH', 'SMS_INSUFFICIENT_BALANCE'],
    ['isv.OUT_OF_SERVICE', 'SMS_INSUFFICIENT_BALANCE'],
    ['isp.RAM_PERMISSION_DENY', 'SMS_AUTH_FAILED'],
    ['InvalidAccessKeyId.NotFound', 'SMS_AUTH_FAILED'],
    ['SignatureDoesNotMatch', 'SMS_AUTH_FAILED'],
    ['isp.SYSTEM_ERROR', 'SMS_PROVIDER_UNAVAILABLE'],
    ['isv.SOMETHING_NEW', 'SMS_REJECTED'],
  ])('maps %s to %s', (code, expected) => {
    expect(aliyunErrorCode(code)).toBe(expected);
  });

  it('throws a readable error carrying the provider code and request id', async () => {
    stubFetch(
      Response.json(
        {
          Code: 'isv.SMS_SIGNATURE_ILLEGAL',
          Message: 'signature illegal',
          RequestId: 'req-42',
        },
        { status: 400 },
      ),
    );
    const error: unknown = await provider.send(send).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SmsProviderError);
    expect(error).toMatchObject({
      code: 'SMS_SIGNATURE_INVALID',
      category: 'configuration',
      outcome: 'permanent',
      providerCode: 'isv.SMS_SIGNATURE_ILLEGAL',
      requestId: 'req-42',
    });
    expect((error as Error).message).toMatch(
      /signature .* not been approved.*isv\.SMS_SIGNATURE_ILLEGAL.*req-42/su,
    );
  });

  it('shows the provider text of an unknown rejection without numbers or links', async () => {
    stubFetch(
      Response.json({
        Code: 'isv.SOMETHING_NEW',
        Message: 'blocked 13800138000 see https://example.test/x',
      }),
    );
    const error = (await provider
      .send(send)
      .catch((e: unknown) => e)) as SmsProviderError;
    expect(error.code).toBe('SMS_REJECTED');
    expect(error.message).toContain('blocked [number] see [link]');
    expect(error.message).not.toContain('13800138000');
  });

  it('keeps the verification code out of every error', async () => {
    stubFetch(Response.json({ Code: 'isv.SMS_TEMPLATE_ILLEGAL' }));
    const error = (await provider
      .send(send)
      .catch((e: unknown) => e)) as SmsProviderError;
    expect(JSON.stringify(error)).not.toContain('246810');
    expect(error.message).not.toContain('246810');
  });

  it('retries nothing for a refused connection that precedes the submission, and doubts a reset', async () => {
    stubFetch(
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }),
      }),
    );
    await expect(provider.send(send)).rejects.toMatchObject({
      code: 'SMS_PROVIDER_UNAVAILABLE',
      outcome: 'retryable',
    });
    stubFetch(
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('reset'), { code: 'ECONNRESET' }),
      }),
    );
    await expect(provider.send(send)).rejects.toMatchObject({
      code: 'SMS_PROVIDER_UNAVAILABLE',
      outcome: 'unknown',
    });
  });

  it('treats an answer that is not JSON as unavailable', async () => {
    stubFetch(new Response('<html>bad gateway</html>', { status: 502 }));
    await expect(provider.send(send)).rejects.toMatchObject({
      code: 'SMS_PROVIDER_UNAVAILABLE',
      outcome: 'unknown',
    });
  });
});

describe('Tencent Cloud SMS', () => {
  const options = {
    secretId: 'AKIDexample',
    secretKey: 'tencent-secret-value',
    sdkAppId: 1400000001,
  };
  const provider = createTencentSmsProvider(options, {
    now: () => 1_764_064_800,
  });

  it('sends the variables by position and signs with TC3-HMAC-SHA256', async () => {
    const fetch = stubFetch(
      Response.json({
        Response: {
          SendStatusSet: [{ Code: 'Ok', SerialNo: 'serial-1' }],
          RequestId: 'req-1',
        },
      }),
    );
    await expect(
      provider.send({
        ...send,
        phone: '+8613800138000',
        templateId: '123456',
        params: { first: 'a', second: 'b' },
      }),
    ).resolves.toEqual({ messageId: 'serial-1' });

    expect(fetch.mock.calls[0]![0]).toBe('https://sms.tencentcloudapi.com/');
    const init = fetch.mock.calls[0]![1]!;
    const body = String(init.body);
    expect(JSON.parse(body)).toEqual({
      PhoneNumberSet: ['+8613800138000'],
      SmsSdkAppId: '1400000001',
      SignName: 'Example',
      TemplateId: '123456',
      TemplateParamSet: ['a', 'b'],
    });
    const headers = init.headers as Record<string, string>;
    expect(headers).toMatchObject({
      'x-tc-action': 'SendSms',
      'x-tc-version': '2021-01-11',
      'x-tc-region': 'ap-guangzhou',
      'x-tc-timestamp': '1764064800',
    });
    // Rebuild the signature as Tencent Cloud's documentation describes it.
    const sha = (value: string): string =>
      createHash('sha256').update(value).digest('hex');
    const mac = (key: string | Buffer, value: string): Buffer =>
      createHmac('sha256', key).update(value).digest();
    const date = '2025-11-25';
    const canonical = `POST\n/\n\ncontent-type:application/json; charset=utf-8\nhost:sms.tencentcloudapi.com\nx-tc-action:sendsms\n\ncontent-type;host;x-tc-action\n${sha(body)}`;
    const toSign = `TC3-HMAC-SHA256\n1764064800\n${date}/sms/tc3_request\n${sha(canonical)}`;
    const key = mac(
      mac(mac('TC3tencent-secret-value', date), 'sms'),
      'tc3_request',
    );
    expect(headers.authorization).toBe(
      `TC3-HMAC-SHA256 Credential=AKIDexample/${date}/sms/tc3_request, SignedHeaders=content-type;host;x-tc-action, Signature=${createHmac('sha256', key).update(toSign).digest('hex')}`,
    );
    expect(JSON.stringify(fetch.mock.calls)).not.toContain(
      'tencent-secret-value',
    );
  });

  it('is deterministic for fixed input', () => {
    const input = {
      secretId: 'id',
      secretKey: 'key',
      host: 'sms.tencentcloudapi.com',
      action: 'SendSms',
      payload: '{}',
      timestamp: 1_764_064_800,
    };
    expect(tencentAuthorization(input)).toBe(tencentAuthorization(input));
    expect(tencentAuthorization({ ...input, payload: '{"a":1}' })).not.toBe(
      tencentAuthorization(input),
    );
  });

  it.each<[string, SmsErrorCode]>([
    ['FailedOperation.SignatureIncorrectOrUnapproved', 'SMS_SIGNATURE_INVALID'],
    ['FailedOperation.TemplateIncorrectOrUnapproved', 'SMS_TEMPLATE_INVALID'],
    [
      'FailedOperation.TemplateParamSetNotMatchApprovedTemplate',
      'SMS_PARAMS_INVALID',
    ],
    ['InvalidParameterValue.IncorrectPhoneNumber', 'SMS_INVALID_PHONE'],
    ['FailedOperation.PhoneNumberInBlacklist', 'SMS_INVALID_PHONE'],
    [
      'FailedOperation.InsufficientBalanceInSmsPackage',
      'SMS_INSUFFICIENT_BALANCE',
    ],
    ['LimitExceeded.PhoneNumberDailyLimit', 'SMS_RATE_LIMITED'],
    ['LimitExceeded.PhoneNumberThirtySecondLimit', 'SMS_RATE_LIMITED'],
    ['AuthFailure.SecretIdNotFound', 'SMS_AUTH_FAILED'],
    ['AuthFailure.SignatureFailure', 'SMS_AUTH_FAILED'],
    ['InternalError.OtherError', 'SMS_PROVIDER_UNAVAILABLE'],
    ['FailedOperation.SomethingNew', 'SMS_REJECTED'],
  ])('maps %s to %s', (code, expected) => {
    expect(tencentErrorCode(code)).toBe(expected);
  });

  it('reads an API-level error and a per-number failure alike', async () => {
    stubFetch(
      Response.json({
        Response: {
          Error: { Code: 'AuthFailure.SecretIdNotFound', Message: 'x' },
          RequestId: 'req-9',
        },
      }),
    );
    await expect(provider.send(send)).rejects.toMatchObject({
      code: 'SMS_AUTH_FAILED',
      requestId: 'req-9',
    });
    stubFetch(
      Response.json({
        Response: {
          SendStatusSet: [
            { Code: 'LimitExceeded.PhoneNumberDailyLimit', Message: 'x' },
          ],
          RequestId: 'req-10',
        },
      }),
    );
    await expect(provider.send(send)).rejects.toMatchObject({
      code: 'SMS_RATE_LIMITED',
      outcome: 'retryable',
      requestId: 'req-10',
    });
  });
});
