import { css } from '@emotion/css';
import { Menu, Select } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../api-client';
import { useCurrentUserContext } from './CurrentUserProvider';

export const ThemeSettings = () => {
  const { t } = useTranslation();
  const ctx = useCurrentUserContext();
  const api = useAPIClient();
  return (
    <Menu.Item key="theme" eventKey={'theme'}>
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
        `}
      >
        {t('Theme')}{' '}
        <Select
          style={{ minWidth: 100 }}
          bordered={false}
          defaultValue={localStorage.getItem('NOCOBASE_THEME')}
          options={[
            { label: t('Default theme'), value: 'default' },
            { label: t('Compact theme'), value: 'compact' },
          ]}
          onChange={async (value) => {
            await api.resource('users').update({
              filterByTk: ctx.data.data.id,
              values: {
                systemSettings: {
                  ...ctx.data.data.systemSettings,
                  theme: value,
                },
              },
            });
            localStorage.setItem('NOCOBASE_THEME', value);
            window.location.reload();
          }}
        />
      </div>
    </Menu.Item>
  );
};
