import { useCookieState } from 'ahooks';
import { Menu, Select } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useACLRoleContext } from '../acl';
import { useAPIClient } from '../api-client';
import { useCurrentUserContext } from './CurrentUserProvider';

const useCurrentRoles = () => {
  const { allowAnonymous } = useACLRoleContext();
  const { data } = useCurrentUserContext();
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
  return options;
};

export const SwitchRole = () => {
  const api = useAPIClient();
  const roles = useCurrentRoles();
  const { t } = useTranslation();
  const [roleName, setRoleName] = useCookieState('currentRoleName', {
    defaultValue: roles?.find((role) => role.default)?.name,
  });
  if (roles.length <= 1) {
    return null;
  }
  return (
    <Menu.Item eventKey={'SwitchRole'}>
      {t('Switch role')}{' '}
      <Select
        style={{ minWidth: 100 }}
        bordered={false}
        fieldNames={{
          label: 'title',
          value: 'name',
        }}
        options={roles}
        value={roleName}
        onChange={async (roleName) => {
          setRoleName(roleName);
          await api.resource('users').setDefaultRole({ values: { roleName } });
          window.location.href = '/';
        }}
      />
    </Menu.Item>
  );
};
