/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../api-client';
import { SelectWithTitle } from '../common';
import { useCurrentRoles } from './CurrentUserProvider';

export const useSwitchRole = () => {
  const api = useAPIClient();
  const roles = useCurrentRoles();
  const { t } = useTranslation();
  const result = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'role',
      eventKey: 'SwitchRole',
      label: (
        <SelectWithTitle
          title={t('Switch role')}
          fieldNames={{
            label: 'title',
            value: 'name',
          }}
          options={roles}
          defaultValue={api.auth.role}
          onChange={async (roleName) => {
            api.auth.setRole(roleName);
            await api.resource('users').setDefaultRole({ values: { roleName } });
            location.reload();
            window.location.reload();
          }}
        />
      ),
    };
  }, [api, roles, t]);

  if (roles.length <= 1) {
    return null;
  }

  return result;
};
