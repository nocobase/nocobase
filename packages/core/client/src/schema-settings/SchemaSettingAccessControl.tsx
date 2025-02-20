/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';
import { SchemaSettingsActionModalItem } from './SchemaSettings';
import { useAPIClient } from '../api-client/hooks/useAPIClient';
import { useRequest } from '../api-client';

const RequestACLSchema = {
  type: 'object',
  properties: {
    roles: {
      type: 'array',
      title: "t('Roles')",
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        tooltip: 't("If not set, all roles can see this action")',
      },
      'x-component': 'RemoteSelect',
      'x-component-props': {
        multiple: true,
        objectValue: true,
        dataSource: 'main',
        service: {
          resource: 'roles',
        },
        manual: false,
        fieldNames: {
          label: 'title',
          value: 'name',
        },
      },
    },
  },
};

export function AccessControl() {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const apiClient = useAPIClient();
  const resource = apiClient.resource('uiSchemas.roles', fieldSchema['x-uid']);
  const { message } = App.useApp();
  const { refresh, data }: any = useRequest(
    {
      url: `/uiSchemas/${fieldSchema['x-uid']}/roles:list`,
    },
    {
      manual: true,
    },
  );
  const AccessControl = (
    <SchemaSettingsActionModalItem
      scope={t}
      title={t('Access control')}
      schema={{
        type: 'object',
        properties: {
          roles: {
            type: 'array',
            title: t('Roles'),
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: t('If not set, all roles can see this action'),
            },
            'x-component': 'RemoteSelect',
            'x-component-props': {
              multiple: true,
              objectValue: true,
              dataSource: 'main',
              service: {
                resource: 'roles',
              },
              manual: false,
              fieldNames: {
                label: 'title',
                value: 'name',
              },
            },
          },
        },
      }}
      initialValues={{
        roles: data?.data,
      }}
      beforeOpen={() => !data && refresh()}
      onSubmit={async ({ roles }) => {
        resource.set({ values: roles.map((v) => v.name) });
        return message.success(t('Saved successfully'));
      }}
    />
  );
  return AccessControl;
}

export const SchemaSettingAccessControl = {
  name: 'accessControl',
  Component: AccessControl,
  useVisible() {
    const fieldSchema = useFieldSchema();
    return fieldSchema['x-decorator'] === 'ACLActionProvider';
  },
};
