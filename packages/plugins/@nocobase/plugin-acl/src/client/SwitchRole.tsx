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
import { useCurrentRoles, useAPIClient, SchemaSettingsItem, SelectWithTitle } from '@nocobase/client';

export const SwitchRole = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const roles = useCurrentRoles();
  if (roles.length <= 1) {
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
        options={roles}
        defaultValue={api.auth.role}
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
