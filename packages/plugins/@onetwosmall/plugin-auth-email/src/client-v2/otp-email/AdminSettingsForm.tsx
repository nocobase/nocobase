/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect, useApp } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { Form, InputNumber, Select } from 'antd';
import React, { lazy, Suspense, useMemo } from 'react';
import { useT, useAuthEmailTranslation } from '../locale';
import PluginAuthEmailClientV2 from '../plugin';

/**
 * Admin settings form for an Email-OTP verifier:
 * 1. Code configuration fields (length, type, expiry, resend interval).
 * 2. `options.provider` selects which configured email provider (SMTP / …)
 *    sends the OTP. The list is the server resource `emailOTPProviders:list`.
 * 3. `options.settings.*` is the provider-specific configuration form,
 *    looked up from the plugin's `emailOTPProviderManager` at runtime.
 */
export function AdminSettingsForm() {
  const { t } = useAuthEmailTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const app = useApp();
  const plugin = app.pm.get(PluginAuthEmailClientV2);
  const form = Form.useFormInstance();
  const providerType: string | undefined = Form.useWatch(['options', 'provider'], form);

  const ProviderSettings = useMemo(() => {
    if (!providerType) return null;
    const loader = plugin?.emailOTPProviderManager.getProvider(providerType)?.components?.AdminSettingsFormLoader;
    return loader ? lazy(loader) : null;
  }, [plugin, providerType]);

  return (
    <>
      <Form.Item
        name={['options', 'codeLength']}
        label={t('Code Length')}
        initialValue={6}
        rules={[{ required: true, message: t('Please enter code length') }]}
      >
        <InputNumber min={4} max={12} />
      </Form.Item>
      <Form.Item
        name={['options', 'codeType']}
        label={t('Code Type')}
        initialValue="numeric"
        rules={[{ required: true }]}
      >
        <Select
          options={[
            { label: t('Numeric'), value: 'numeric' },
            { label: t('Alphabetic'), value: 'alpha' },
            { label: t('Alphanumeric'), value: 'alphanumeric' },
          ]}
        />
      </Form.Item>
      <Form.Item
        name={['options', 'expiresIn']}
        label={t('Expires In (seconds)')}
        initialValue={120}
        rules={[{ required: true, message: t('Please enter expiry time') }]}
      >
        <InputNumber min={60} max={3600} />
      </Form.Item>
      <Form.Item
        name={['options', 'resendInterval']}
        label={t('Resend Interval (seconds)')}
        initialValue={60}
        rules={[{ required: true, message: t('Please enter resend interval') }]}
      >
        <InputNumber min={10} max={600} />
      </Form.Item>
      <Form.Item
        name={['options', 'provider']}
        label={t('Provider')}
        rules={[{ required: true, message: t('Please select a provider') }]}
      >
        <RemoteSelect<{ name: string; title: string }>
          request={async () => {
            const response = await ctx.api.resource('emailOTPProviders').list();
            const data = response?.data?.data;
            return Array.isArray(data) ? data : [];
          }}
          cacheKey="@onetwosmall/plugin-auth-email:emailOTPProviders:list"
          mapOptions={(item) => ({ label: compileT(item.title || item.name), value: item.name })}
        />
      </Form.Item>
      {ProviderSettings ? (
        <Suspense fallback={null}>
          <ProviderSettings />
        </Suspense>
      ) : null}
    </>
  );
}

export default AdminSettingsForm;
