import { MenuProps, Select } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APIClient, useAPIClient } from '../api-client';
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

function _SelectWithTitle({ t, roles, api }: { t; roles: any; api: APIClient }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<any>(null);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onClick={() => setOpen((v) => !v)}
      onMouseLeave={() => {
        timerRef.current = setTimeout(() => {
          setOpen(false);
        }, 200);
      }}
    >
      {t('Switch role')}
      <Select
        style={{ textAlign: 'right', minWidth: 100 }}
        open={open}
        data-testid="select-switch-role"
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
        onMouseEnter={() => {
          clearTimeout(timerRef.current);
        }}
      />
    </div>
  );
}
