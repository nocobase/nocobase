/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCurrentRoles,
  useAPIClient,
  SchemaSettingsItem,
  SelectWithTitle,
  useCurrentRoleMode,
} from '@nocobase/client';
import { Divider } from 'antd';
import _ from 'lodash';

export const SwitchRole = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const roles = _.cloneDeep(useCurrentRoles());
  const roleMode = useCurrentRoleMode();
  const currentRole = roles.find((role) => role.name === api.auth.role)?.name;
  if (roleMode === 'allow-use-union') {
    roles.unshift({
      name: '__union__',
      title: t('Full permissions', { ns: 'acl' }),
    });
  }
  // 当角色数量小于等于1 或者 是仅使用合并角色模式时，不显示切换角色选项
  if (roles.length <= 1 || roleMode === 'only-use-union') {
    return null;
  }
  return (
    <SchemaSettingsItem eventKey="SwitchRole" title="SwitchRole">
      <SelectWithTitle
        title={t('Switch role')}
        fieldNames={{
          label: 'title',
          value: 'name',
        }}
        options={roles.reduce((acc, role) => {
          acc.push(role);
          if (role.name === '__union__') {
            acc.push({
              name: 'divider',
              title: <Divider style={{ margin: '2px 1px' }} />,
              disabled: true,
              style: {
                minHeight: 0,
                height: 'auto',
                padding: 0,
              },
            });
          }
          return acc;
        }, [])}
        defaultValue={currentRole || roles[0].name}
        onChange={async (roleName) => {
          api.auth.setRole(roleName);
          await api.resource('users').setDefaultRole({ values: { roleName } });
          location.reload();
          window.location.reload();
        }}
      />
    </SchemaSettingsItem>
  );
};
