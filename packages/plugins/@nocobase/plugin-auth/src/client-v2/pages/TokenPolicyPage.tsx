/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Card, Form, InputNumber, Select, Spin } from 'antd';
import ms from 'ms';
import React, { useEffect } from 'react';
import { tokenPolicyCollectionName, tokenPolicyRecordKey } from '../../constants';
import { useT } from '../locale';

type TimeUnit = 'm' | 'h' | 'd';

const TIME_UNIT_PATTERN = /^(\d+)([mhd])$/;

export interface TokenPolicyConfig {
  sessionExpirationTime: string;
  tokenExpirationTime: string;
  expiredTokenRenewLimit: string;
}

export interface InputTimeProps {
  value?: string;
  onChange?: (next: string) => void;
  minNum?: number;
  disabled?: boolean;
}

export function parseTimeValue(raw: string | undefined): { time: number; unit: TimeUnit } {
  const match = typeof raw === 'string' ? raw.match(TIME_UNIT_PATTERN) : null;
  if (!match) return { time: 10, unit: 'm' };
  return { time: parseInt(match[1], 10), unit: match[2] as TimeUnit };
}

/**
 * Returns true when `token` is a strictly shorter duration than `session`. Both arguments are `ms`-compatible strings such as `"30m"` / `"1d"` / `"7d"`. Used as the cross-field check on Submit — the server rejects token >= session, so the v2 page mirrors v1 and surfaces the error inline before sending the request.
 */
export function isTokenShorterThanSession(token: string, session: string): boolean {
  const tokenMs = ms(token);
  const sessionMs = ms(session);
  if (typeof tokenMs !== 'number' || typeof sessionMs !== 'number') return false;
  return tokenMs < sessionMs;
}

export const InputTime: React.FC<InputTimeProps> = ({ value, onChange, minNum = 1, disabled }) => {
  const t = useT();
  const { time, unit } = parseTimeValue(value);

  useEffect(() => {
    if (!value || !TIME_UNIT_PATTERN.test(value)) {
      onChange?.('10m');
    }
    // run once on mount to normalise a missing value, same as v1's behaviour
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unitSelect = (
    <Select
      value={unit}
      disabled={disabled}
      onChange={(nextUnit: TimeUnit) => onChange?.(`${time}${nextUnit}`)}
      style={{ width: 120 }}
      options={[
        { value: 'm', label: t('Minutes') },
        { value: 'h', label: t('Hours') },
        { value: 'd', label: t('Days') },
      ]}
    />
  );

  return (
    <InputNumber
      value={time}
      addonAfter={unitSelect}
      min={minNum}
      disabled={disabled}
      onChange={(nextTime) => onChange?.(`${nextTime ?? minNum}${unit}`)}
    />
  );
};

export function TokenPolicyPage() {
  const t = useT();
  const ctx = useFlowContext();
  const { message } = App.useApp();
  const [form] = Form.useForm<TokenPolicyConfig>();
  const [submitting, setSubmitting] = React.useState(false);

  const { data: policyConfig, loading } = useRequest<Partial<TokenPolicyConfig>, []>(async () => {
    const response = await ctx.api.resource(tokenPolicyCollectionName).get({ filterByTk: tokenPolicyRecordKey });
    return response?.data?.data?.config || {};
  });

  useEffect(() => {
    if (policyConfig && Object.keys(policyConfig).length > 0) {
      form.setFieldsValue(policyConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyConfig]);

  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    if (!isTokenShorterThanSession(values.tokenExpirationTime, values.sessionExpirationTime)) {
      form.setFields([
        {
          name: 'tokenExpirationTime',
          errors: [t('Token validity period must be less than session validity period!')],
        },
      ]);
      return;
    }
    setSubmitting(true);
    try {
      await ctx.api.resource(tokenPolicyCollectionName).update({
        filterByTk: tokenPolicyRecordKey,
        values: { config: values },
      });
      message.success(t('Saved successfully!'));
    } finally {
      setSubmitting(false);
    }
  });

  if (loading) return <Spin />;

  return (
    <Card variant="borderless">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="sessionExpirationTime"
          label={t('Session validity period')}
          extra={t(
            'The maximum valid time for each user login. During the session validity, the Token will be automatically updated. After the timeout, the user is required to log in again.',
          )}
          rules={[{ required: true }]}
        >
          <InputTime />
        </Form.Item>
        <Form.Item
          name="tokenExpirationTime"
          label={t('Token validity period')}
          extra={t(
            'The validity period of each issued API Token. After the Token expires, if it is within the session validity period and has not exceeded the refresh limit, the server will automatically issue a new Token to maintain the user session, otherwise the user is required to log in again. (Each Token can only be refreshed once)',
          )}
          rules={[{ required: true }]}
        >
          <InputTime />
        </Form.Item>
        <Form.Item
          name="expiredTokenRenewLimit"
          label={t('Expired token refresh limit')}
          extra={t(
            'The maximum time limit allowed for refreshing a Token after it expires. After this time limit, the token cannot be automatically renewed, and the user needs to log in again.',
          )}
          rules={[{ required: true }]}
        >
          <InputTime minNum={0} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {t('Submit')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default TokenPolicyPage;
