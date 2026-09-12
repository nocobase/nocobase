/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Checkbox, Form, Select } from 'antd';
import { EnvVariableInput } from '@nocobase/client-v2';
import { useT } from '../../locale';

const scopeOptions = [
  {
    label: 'GIGACHAT_API_PERS',
    value: 'GIGACHAT_API_PERS',
  },
  {
    label: 'GIGACHAT_API_B2B',
    value: 'GIGACHAT_API_B2B',
  },
  {
    label: 'GIGACHAT_API_CORP',
    value: 'GIGACHAT_API_CORP',
  },
];

const formLabel = (label: string) => `${label}:`;

export const ProviderSettingsForm: React.FC = () => {
  const t = useT();

  return (
    <>
      <Form.Item name={['options', 'apiKey']} label={formLabel(t('Authorization key'))} rules={[{ required: true }]}>
        <EnvVariableInput password />
      </Form.Item>
      <Form.Item name={['options', 'scope']} label={formLabel(t('Scope'))} rules={[{ required: true }]}>
        <Select options={scopeOptions} />
      </Form.Item>
      <Form.Item name={['options', 'authURL']} label={formLabel(t('Auth URL'))}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'enableSSL']}
        label={formLabel(t('Verify certificates'))}
        valuePropName="checked"
        initialValue={true}
      >
        <Checkbox />
      </Form.Item>
    </>
  );
};
