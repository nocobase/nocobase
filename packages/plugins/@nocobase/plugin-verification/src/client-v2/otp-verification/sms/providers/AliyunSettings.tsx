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
 * Aliyun SMS provider settings. Field names match the v1 schema 1:1, so
 * the persisted shape on the server is unchanged. Each value can be a
 * literal credential or an `{{ $env.X }}` reference; secret fields use
 * `EnvVariableInput`'s `password` mode to mask non-variable values.
 */
export function AliyunSettings() {
  const { t } = useVerificationTranslation();

  return (
    <>
      <Form.Item
        name={['options', 'settings', 'accessKeyId']}
        label={t('Access Key ID')}
        rules={[{ required: true, message: t('Please enter the Access Key ID') }]}
      >
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'accessKeySecret']}
        label={t('Access Key Secret')}
        rules={[{ required: true, message: t('Please enter the Access Key Secret') }]}
      >
        <EnvVariableInput password />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'endpoint']}
        label={t('Endpoint')}
        rules={[{ required: true, message: t('Please enter the endpoint') }]}
      >
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'sign']}
        label={t('Sign')}
        rules={[{ required: true, message: t('Please enter the sign') }]}
      >
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'settings', 'template']}
        label={t('Template code')}
        rules={[{ required: true, message: t('Please enter the template code') }]}
      >
        <EnvVariableInput />
      </Form.Item>
    </>
  );
}

export default AliyunSettings;
