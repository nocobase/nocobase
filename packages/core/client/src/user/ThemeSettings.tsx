import { Menu, Select } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const ThemeSettings = () => {
  const { t } = useTranslation();
  return (
    <Menu.Item key="theme" eventKey={'theme'}>
      {t('Theme')}{' '}
      <Select
        style={{ minWidth: 100 }}
        bordered={false}
        defaultValue={localStorage.getItem('NOCOBASE_THEME') || 'default'}
        options={[
          { label: t('Default theme'), value: 'default' },
          { label: t('Compact theme'), value: 'compact' },
        ]}
        onChange={async (value) => {
          localStorage.setItem('NOCOBASE_THEME', value);
          window.location.reload();
        }}
      />
    </Menu.Item>
  );
};
