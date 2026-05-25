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
import { Form } from 'antd';
import React, { lazy, Suspense, useMemo } from 'react';
import { useT, useVerificationTranslation } from '../../locale';
import PluginVerificationClientV2 from '../../plugin';

/**
 * Admin settings form for an SMS-OTP verifier:
 * 1. `options.provider` selects which configured SMS provider (Aliyun /
 *    Tencent / …) sends the OTP. The list is the server resource
 *    `smsOTPProviders:list`.
 * 2. `options.settings.*` is the provider-specific configuration form,
 *    looked up from the plugin's `smsOTPProviderManager` at runtime so
 *    third-party providers contributed via `registerProvider()` slot in
 *    automatically.
 */
export function AdminSettingsForm() {
  const { t } = useVerificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const app = useApp();
  // Avoid a hard import of the plugin class to keep the SMS module
  // tree-shake friendly; resolve it at runtime via the plugin registry.
  const plugin = app.pm.get(PluginVerificationClientV2);
  const form = Form.useFormInstance();
  const providerType: string | undefined = Form.useWatch(['options', 'provider'], form);

  const ProviderSettings = useMemo(() => {
    if (!providerType) return null;
    const loader = plugin?.smsOTPProviderManager.getProvider(providerType)?.components?.AdminSettingsFormLoader;
    return loader ? lazy(loader) : null;
  }, [plugin, providerType]);

  return (
    <>
      <Form.Item
        name={['options', 'provider']}
        label={t('Provider')}
        rules={[{ required: true, message: t('Please select a provider') }]}
      >
        <RemoteSelect<{ name: string; title: string }>
          request={async () => {
            const response = await ctx.api.resource('smsOTPProviders').list();
            const data = response?.data?.data;
            return Array.isArray(data) ? data : [];
          }}
          cacheKey="@nocobase/plugin-verification:smsOTPProviders:list"
          // Server titles are stored as legacy schema templates
          // (e.g. `{{t("Aliyun SMS", {"ns":"…"})}}`); useT() routes through
          // flowEngine.context.t which expands those templates natively.
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
