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
import { useT } from '../../locale';

const schema = {
  type: 'object',
  properties: {
    temperature: {
      type: 'number',
      title: '{{t("Temperature")}}',
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
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 128000,
      },
      default: 4096,
    },
    topP: {
      type: 'number',
      title: '{{t("Top P")}}',
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
      'x-decorator': 'FormItem',
      'x-component': 'Slider',
      'x-component-props': {
        min: 0,
        max: 2,
        step: 0.1,
      },
      default: 0,
    },
    presencePenalty: {
      type: 'number',
      title: '{{t("Presence penalty")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Slider',
      'x-component-props': {
        min: 0,
        max: 2,
        step: 0.1,
      },
      default: 0,
    },
  },
};

export const UnifiedModelSettings: React.FC = () => {
  const t = useT();
  return <SchemaComponent schema={schema} scope={{ t }} />;
};
