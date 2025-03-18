/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ISchema, SchemaComponent } from '@nocobase/client';
import { Card } from 'antd';
import { uid } from '@formily/shared';
import { tval } from '@nocobase/utils/client';
import { useAuthTranslation } from '../../locale';
import { hooksNameMap, hooksMap } from './hooks';
import { componentsMap, componentsNameMap } from './components';
import { TokenPolicyConfig } from '../../../types';

type Properties = {
  [K in keyof TokenPolicyConfig | 'footer']: any;
};
const schema: ISchema & { properties: Properties } = {
  name: uid(),
  'x-component': 'FormV2',
  'x-use-component-props': hooksNameMap.useEditForm,
  type: 'object',
  properties: {
    sessionExpirationTime: {
      type: 'string',
      title: "{{t('Session validity period')}}",
      'x-decorator': 'FormItem',
      'x-component': componentsNameMap.InputTime,
      required: true,
      description: tval(
        'The maximum valid time for each user login. During the session validity, the Token will be automatically updated. After the timeout, the user is required to log in again.',
      ),
    },
    tokenExpirationTime: {
      type: 'string',
      title: "{{t('Token validity period')}}",
      'x-decorator': 'FormItem',
      'x-component': componentsNameMap.InputTime,
      required: true,
      description: tval(
        'The validity period of each issued API Token. After the Token expires, if it is within the session validity period and has not exceeded the refresh limit, the server will automatically issue a new Token to maintain the user session, otherwise the user is required to log in again. (Each Token can only be refreshed once)',
      ),
    },
    expiredTokenRenewLimit: {
      type: 'string',
      title: "{{t('Expired token refresh limit')}}",
      'x-decorator': 'FormItem',
      'x-component': componentsNameMap.InputTime,
      'x-component-props': {
        minNum: 0,
      },
      required: true,
      description: tval(
        'The maximum time limit allowed for refreshing a Token after it expires. After this time limit, the token cannot be automatically renewed, and the user needs to log in again.',
      ),
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

export const TokenPolicySettings = () => {
  const { t } = useAuthTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent schema={schema} scope={{ t, ...hooksMap }} components={componentsMap}></SchemaComponent>
    </Card>
  );
};
