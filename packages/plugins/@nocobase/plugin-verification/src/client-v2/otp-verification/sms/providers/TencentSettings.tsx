/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EnvVariableInput } from '@nocobase/client-v2';
import { Form } from 'antd';
import React from 'react';
import { useVerificationTranslation } from '../../../locale';

/**
 * Tencent SMS provider settings. Mirror of v1 schema; persisted payload
 * keys are unchanged. Secret credentials use `EnvVariableInput`'s
 * `password` mode so literal values are masked but `{{ $env.X }}`
 * references stay editable through the picker.
 */
export function TencentSettings() {
  const { t } = useVerificationTranslation();

  return (
    <>
      <Form.Item
        name={['options', 'settings', 'secretId']}
        label={t('Secret Id')}
        rules={[{ required: true, message: t('Please enter the Secret Id') }]}
      >
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'secretKey']}
        label={t('Secret Key')}
        rules={[{ required: true, message: t('Please enter the Secret Key') }]}
      >
        <EnvVariableInput password />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'region']}
        label={t('Region')}
        rules={[{ required: true, message: t('Please enter the region') }]}
      >
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'endpoint']}
        label={t('Endpoint')}
        initialValue="sms.tencentcloudapi.com"
      >
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'settings', 'SignName']} label={t('Sign name')}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'SmsSdkAppId']}
        label={t('Sms sdk app id')}
        rules={[{ required: true, message: t('Please enter the Sms sdk app id') }]}
      >
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'TemplateId']}
        label={t('Template Id')}
        rules={[{ required: true, message: t('Please enter the Template Id') }]}
      >
        <EnvVariableInput />
      </Form.Item>
    </>
  );
}

export default TencentSettings;
