/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ISchema, SchemaComponent, ExtendCollectionsProvider } from '@nocobase/client';
import { Card } from 'antd';
import { uid } from '@formily/shared';
import { hooksNameMap, hooksMap } from './hooks';
import { SecurityAccessConfig } from '../../../types';

type Properties = {
  [K in keyof SecurityAccessConfig | 'footer']: any;
};
const schema: ISchema & { properties: Properties } = {
  name: uid(),
  'x-component': 'FormV2',
  'x-use-component-props': hooksNameMap.useEditForm,
  type: 'object',
  properties: {
    tokenExpirationTime: {
      type: 'string',
      title: "{{t('Token expiration time')}}",
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      required: true,
    },
    maxTokenLifetime: {
      type: 'string',
      title: "{{t('Max token lifetime')}}",
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      required: true,
    },
    opTimeoutControlEnabled: {
      type: 'boolean',
      title: "{{t('Enable op timeout control')}}",
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    renewalTokenEnabled: {
      type: 'string',
      title: "{{t('Enable renew token')}}",
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    maxInactiveInterval: {
      type: 'string',
      title: "{{t('Max inactive interval')}}",
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    footer: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-component-props': {
        layout: 'one-column',
      },
      properties: {
        submit: {
          title: '{{t("Submit")}}',
          'x-component': 'Action',
          'x-use-component-props': hooksNameMap.useSubmitActionProps,
        },
      },
    },
  },
};

export const AccessSettings = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent schema={schema} scope={hooksMap}></SchemaComponent>
    </Card>
  );
};
