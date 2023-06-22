import { MenuProps, Select } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../api-client';
import { useCurrentUserContext } from './CurrentUserProvider';

export const useThemeSettings = () => {
  const { t } = useTranslation();
  const ctx = useCurrentUserContext();
  const api = useAPIClient();

  return useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'theme',
      eventKey: 'theme',
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
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
      ),
    };
  }, [ctx.data.data.id, ctx.data.data.systemSettings]);
};
