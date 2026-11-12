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
import { useAuthEmailTranslation } from '../locale';

export interface VerificationCodeProps {
  /** Persisted OTP value. Controlled by the parent `Form.Item`. */
  value?: string;
  onChange?: (next: string) => void;
  /**
   * Server-side action the OTP grants (e.g. `auth:signIn:email`,
   * `verifiers:bind`). Forwarded to the `emailOTP:*` endpoint so the
   * OTP is bound to a specific action.
   */
  actionType: string;
  /** Verifier name (a row in the `verifiers` collection). */
  verifier: string;
  /**
   * The email address the OTP is sent to. Parent reads it via
   * `Form.useWatch('uuid', form)` and forwards it here. Required at send
   * time — the send button is disabled until it has a value.
   */
  email?: string;
  /**
   * Whether the user is already signed in. Drives the choice between
   * `emailOTP:create` (logged-in) and `emailOTP:publicCreate` (anonymous).
   * Defaults to `false` (anonymous).
   */
  isLogged?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Verification-code input + "Send code / Retry in N s" button pair.
 *
 * v2 rewrite of v1's `VerificationCode`:
 * - No `withDynamicSchemaProps`, no `@formily/react` `useForm()` —
 *   the parent owns the email value via `Form.useWatch` and passes it
 *   in as a prop.
 * - Countdown starts from the server-reported `expiresAt` so the UI
 *   tracks the same window the server enforces.
 * - Clearing the code on resend matches v1 behaviour so the user has
 *   to type the new code rather than reusing the stale one.
 */
export function VerificationCode(props: VerificationCodeProps) {
  const { value, onChange, actionType, verifier, email, isLogged, disabled, placeholder } = props;
  const { t } = useAuthEmailTranslation();
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
    if (!email) {
      message.error(t('Please fill in your email address'));
      return;
    }
    const method = isLogged ? 'create' : 'publicCreate';
    try {
      const response = await ctx.api.resource('emailOTP')[method]({
        values: {
          action: actionType,
          verifier,
          uuid: email,
        },
      });
      const data = response?.data?.data || {};
      message.success(t('Operation succeeded'));
      if (value) onChange?.('');
      const expiresIn = data.expiresAt
        ? Math.max(1, Math.ceil((Date.parse(data.expiresAt) - Date.now()) / 1000))
        : data.resendInterval || 60;
      setCount(expiresIn);
      timerRef.current = setInterval(() => {
        setCount((c) => c - 1);
      }, 1000);
    } catch (error: any) {
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
