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
import { useAuthTranslation } from '../../locale';
import { hooksNameMap, hooksMap } from './hooks';
import { componentsMap, componentsNameMap } from './components';
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
    maxTokenLifetime: {
      type: 'string',
      title: "{{t('Login validity period')}}",
      'x-decorator': 'FormItem',
      'x-component': componentsNameMap.InputTime,
      required: true,
    },
    tokenExpirationTime: {
      type: 'string',
      title: "{{t('Token validity period')}}",
      'x-decorator': 'FormItem',
      'x-component': componentsNameMap.InputTime,
      required: true,
    },
    maxInactiveInterval: {
      type: 'string',
      title: "{{t('Page inactivity timeout')}}",
      'x-decorator': 'FormItem',
      'x-component': componentsNameMap.InputTime,
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
  const { t } = useAuthTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent schema={schema} scope={{ t, ...hooksMap }} components={componentsMap}></SchemaComponent>
    </Card>
  );
};
