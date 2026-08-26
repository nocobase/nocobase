/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { App, Button, Input, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useVerificationTranslation } from '../locale';

export interface VerificationCodeProps {
  /** Persisted OTP value. Controlled by the parent `Form.Item`. */
  value?: string;
  onChange?: (next: string) => void;
  /**
   * Server-side action the OTP grants (e.g. `auth:signIn`,
   * `verifiers:bind`, `twoFactorAuth:verify`). Forwarded to the
   * `smsOTP:*` endpoint so the OTP is bound to a specific action.
   */
  actionType: string;
  /** Verifier name (a row in the `verifiers` collection). */
  verifier: string;
  /**
   * The phone number the OTP is sent to. Parent reads it via
   * `Form.useWatch('uuid', form)` and forwards it here. Required at send
   * time — the send button is disabled until it has a value.
   */
  phone?: string;
  /**
   * Whether the user is already signed in. Drives the choice between
   * `smsOTP:create` (logged-in) and `smsOTP:publicCreate` (anonymous).
   * Defaults to `false` (anonymous).
   */
  isLogged?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Verification-code input + "Send code / Retry in N s" button pair.
 *
 * Rewrite of v1's `VerificationCode`:
 * - No `withDynamicSchemaProps`, no `useForm()` — the parent owns the
 *   phone value via `Form.useWatch` and passes it in as a prop.
 * - Countdown starts from the server-reported `expiresAt` so the UI
 *   tracks the same window the server enforces.
 * - Clearing the code on resend matches v1 behaviour so the user has
 *   to type the new code rather than reusing the stale one.
 */
export function VerificationCode(props: VerificationCodeProps) {
  const { value, onChange, actionType, verifier, phone, isLogged, disabled, placeholder } = props;
  const { t } = useVerificationTranslation();
  const ctx = useFlowContext();
  const { message, notification } = App.useApp();

  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (count <= 0 && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [count]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const onGetCode = useMemoizedFn(async () => {
    if (count > 0) return;
    if (!phone) {
      message.error(t('Please enter a phone number first'));
      return;
    }
    const method = isLogged ? 'create' : 'publicCreate';
    try {
      const response = await ctx.api.resource('smsOTP')[method]({
        values: {
          action: actionType,
          verifier,
          uuid: phone,
        },
      });
      const data = response?.data?.data || {};
      message.success(t('Operation succeeded'));
      if (value) onChange?.('');
      const expiresIn = data.expiresAt ? Math.max(1, Math.ceil((Date.parse(data.expiresAt) - Date.now()) / 1000)) : 60;
      setCount(expiresIn);
      timerRef.current = setInterval(() => {
        setCount((c) => c - 1);
      }, 1000);
    } catch (error: any) {
      // v1 surfaces SMS send failures through a top-right notification —
      // the underlying provider (Aliyun / Tencent) commonly fails with a
      // misconfigured sign / template / endpoint, and a silent console
      // swallow leaves the user clicking "Send code" with no feedback.
      const serverMessage = error?.response?.data?.errors?.[0]?.message || error?.message;
      notification.error({
        message: serverMessage || t('Verification send failed, please try later or contact to administrator'),
      });
    }
  });

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
      <Button onClick={onGetCode} disabled={disabled || count > 0}>
        {count > 0 ? t('Retry after {{count}} seconds', { count }) : t('Send code')}
      </Button>
    </Space.Compact>
  );
}

export default VerificationCode;
