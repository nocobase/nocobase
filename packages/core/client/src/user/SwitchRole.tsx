import { MenuProps, Select } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../api-client';
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {t('Switch role')}{' '}
          <Select
            data-testid="antd-select"
            style={{ minWidth: 100 }}
            bordered={false}
            popupMatchSelectWidth={false}
            fieldNames={{
              label: 'title',
              value: 'name',
            }}
            options={roles}
            value={api.auth.role}
            onChange={async (roleName) => {
              api.auth.setRole(roleName);
              await api.resource('users').setDefaultRole({ values: { roleName } });
              location.reload();
              window.location.reload();
            }}
          />
        </div>
      ),
    };
  }, [api, history, roles]);

  if (roles.length <= 1) {
    return null;
  }

  return result;
};
