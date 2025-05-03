/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';
import { SchemaSettingsActionModalItem } from './SchemaSettings';
import { useAPIClient } from '../api-client/hooks/useAPIClient';
import { useDesignable } from '../schema-component/hooks/useDesignable';
import { useRequest } from '../api-client';
import { useACLContext } from '../acl';

export function AccessControl() {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const apiClient = useAPIClient();
  const resource = apiClient.resource('uiSchemas.roles', fieldSchema['x-uid']);
  const { message } = App.useApp();
  const { dn } = useDesignable();
  const { refresh, data }: any = useRequest(
    {
      url: `/uiSchemas/${fieldSchema['x-uid']}/roles:list`,
    },
    {
      manual: true,
    },
  );
  const { refresh: refreshRoleCheck } = useACLContext();

  useEffect(() => {
    if (
      fieldSchema['x-decorator'] !== 'ACLActionProvider' &&
      fieldSchema['x-decorator'] !== `CustomRequestAction.Decorator` &&
      fieldSchema['x-component'] !== 'WorkbenchAction'
    ) {
      dn.emit('patch', {
        schema: {
          ['x-uid']: fieldSchema['x-uid'],
          'x-decorator': 'ACLActionProvider',
        },
      });
      fieldSchema['x-decorator'] = 'ACLActionProvider';
      dn.refresh();
    }
  }, []);

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
        await resource.set({ values: roles.map((v) => v.name) });
        await refreshRoleCheck();
        return message.success(t('Saved successfully'));
      }}
    />
  );
  return AccessControl;
}

export const SchemaSettingAccessControl = {
  name: 'accessControl',
  Component: AccessControl,
};
