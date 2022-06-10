import { Menu, Select } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useACLRoleContext } from '../acl';
import { useAPIClient } from '../api-client';
import { useCompile } from '../schema-component';
import { useCurrentUserContext } from './CurrentUserProvider';

const useCurrentRoles = () => {
  const { allowAnonymous } = useACLRoleContext();
  const { data } = useCurrentUserContext();
  const compile = useCompile();
  const options = (data?.data?.roles || []).map((item) => {
    return {
      title: item.title,
      name: item.name,
    };
  });
  if (allowAnonymous) {
    options.push({
      title: 'Anonymous',
      name: 'anonymous',
    });
  }
  return compile(options);
};

export const SwitchRole = () => {
  const api = useAPIClient();
  const roles = useCurrentRoles();
  const { t } = useTranslation();
  if (roles.length <= 1) {
    return null;
  }
  return (
    <Menu.Item key="role" eventKey={'SwitchRole'}>
      {t('Switch role')}{' '}
      <Select
        style={{ minWidth: 100 }}
        bordered={false}
        fieldNames={{
          label: 'title',
          value: 'name',
        }}
        options={roles}
        value={api.auth.role}
        onChange={async (roleName) => {
          api.auth.setRole(roleName);
          await api.resource('users').setDefaultRole({ values: { roleName } });
          window.location.href = '/';
        }}
      />
    </Menu.Item>
  );
};
