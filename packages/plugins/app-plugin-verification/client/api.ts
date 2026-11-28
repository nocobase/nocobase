import { ApiClientError, type ApiClient } from '@nocobase/app-client';

import type {
  BindPhoneInput,
  CodeTiming,
  IssueStepUpTokenInput,
  PhoneView,
  SendVerificationCodeInput,
  StepUpCredential,
} from '../shared/contracts.js';

export interface BindVerifiedPhoneInput extends BindPhoneInput {
  /** Required when changing an existing phone. */
  readonly token?: string;
}

export interface VerificationRateLimit {
  /** The Retry-After response header. Verification sends a delay in seconds. */
  readonly retryAfter?: string;
  /** The server's next allowed send time, in ISO format. */
  readonly retryAt?: string;
}

interface DataResponse<T> {
  readonly data: T;
}

export async function sendVerificationCode(
  api: ApiClient,
  { scene, phone, purpose }: SendVerificationCodeInput,
): Promise<CodeTiming> {
  const { data } = await api.request<DataResponse<CodeTiming>>({
    method: 'POST',
    path: 'verification/codes/send',
    json: { scene, phone, purpose },
  });
  return data;
}

export async function issueStepUpToken(
  api: ApiClient,
  { purpose, code }: IssueStepUpTokenInput,
): Promise<StepUpCredential> {
  const { data } = await api.request<DataResponse<StepUpCredential>>({
    method: 'POST',
    path: 'verification/stepUpTokens',
    json: { purpose, code },
  });
  return data;
}

export async function getMyVerifiedPhone(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<PhoneView> {
  const { data } = await api.request<DataResponse<PhoneView>>({
    path: 'verification/me/phone',
    signal,
  });
  return data;
}

export async function bindPhone(
  api: ApiClient,
  { phone, code, token }: BindVerifiedPhoneInput,
): Promise<PhoneView> {
  const { data } = await api.request<DataResponse<PhoneView>>({
    method: 'PUT',
    path: 'verification/me/phone',
    json: { phone, code },
    headers:
      token === undefined ? undefined : { 'X-Verification-Token': token },
  });
  return data;
}

export function getVerificationRateLimit(
  error: unknown,
): VerificationRateLimit | undefined {
  if (!(error instanceof ApiClientError) || error.status !== 429)
    return undefined;

  const payload = error.payload as
    | {
        readonly error?: { readonly metadata?: { readonly retryAt?: unknown } };
      }
    | undefined;
  const retryAt = payload?.error?.metadata?.retryAt;
  return {
    retryAfter: error.retryAfter,
    retryAt: typeof retryAt === 'string' ? retryAt : undefined,
  };
}
