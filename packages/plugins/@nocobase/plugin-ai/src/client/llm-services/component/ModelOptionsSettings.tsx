/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { Collapse } from 'antd';
import { useT } from '../../locale';

const schema = {
  type: 'object',
  properties: {
    temperature: {
      type: 'number',
      title: '{{t("Temperature")}}',
      description: '{{t("Temperature description")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Slider',
      'x-component-props': {
        min: 0,
        max: 2,
        step: 0.1,
      },
      default: 1,
    },
    maxTokens: {
      type: 'number',
      title: '{{t("Max tokens")}}',
      description: '{{t("Max completion tokens description")}}',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 128000,
        placeholder: '{{t("Leave empty for no limit")}}',
      },
    },
    topP: {
      type: 'number',
      title: '{{t("Top P")}}',
      description: '{{t("Top P description")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Slider',
      'x-component-props': {
        min: 0,
        max: 1,
        step: 0.1,
      },
      default: 1,
    },
    frequencyPenalty: {
      type: 'number',
      title: '{{t("Frequency penalty")}}',
      description: '{{t("Frequency penalty description")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Slider',
      'x-component-props': {
        min: -2,
        max: 2,
        step: 0.1,
      },
      default: 0,
    },
    presencePenalty: {
      type: 'number',
      title: '{{t("Presence penalty")}}',
      description: '{{t("Presence penalty description")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Slider',
      'x-component-props': {
        min: -2,
        max: 2,
        step: 0.1,
      },
      default: 0,
    },
  },
};

export const ModelOptionsSettings: React.FC = () => {
  const t = useT();

  return (
    <Collapse
      bordered={false}
      size="small"
      style={{ marginTop: 16 }}
      items={[
        {
          key: 'modelOptions',
          label: t('Model options'),
          forceRender: true,
          children: <SchemaComponent schema={schema} scope={{ t }} />,
        },
      ]}
    />
  );
};
