/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionInitializer } from '@nocobase/client';
import React, { forwardRef, useContext, useEffect } from 'react';
import { useChartsTranslation } from '../locale';
import { Dropdown, MenuProps } from 'antd';
import { DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { GlobalAutoRefreshContext } from '../block/GlobalAutoRefreshProvider';

export const BlockRefreshButton: React.FC = forwardRef<HTMLButtonElement | HTMLAnchorElement, any>((props, ref) => {
  const { t } = useChartsTranslation();
  const { autoRefresh, setAutoRefresh } = useContext(GlobalAutoRefreshContext);
  const interval = {
    5: '5s',
    10: '10s',
    30: '30s',
    60: '1m',
    300: '5m',
    900: '15m',
    1800: '30m',
    3600: '1h',
    7200: '2h',
    86400: '1d',
  };
  const items: MenuProps['items'] = Object.entries(interval).map(([key, label]) => ({
    key,
    label,
    onClick: () => setAutoRefresh(+key),
  }));
  return (
    <Dropdown.Button
      {...props}
      menu={{
        items: [
          {
            key: 'off',
            label: t('Off'),
            onClick: () => setAutoRefresh(false),
          },
          ...items,
        ],
      }}
      icon={<DownOutlined />}
      buttonsRender={([_, rightButton]) => [
        _,
        React.cloneElement(
          rightButton as React.ReactElement<any, string>,
          { iconPosition: 'end' },
          autoRefresh ? interval[autoRefresh as number] : null,
        ),
      ]}
    >
      <ReloadOutlined />
      {t('Refresh')}
      {props.children}
    </Dropdown.Button>
  );
});

export const useChartBlockRefreshActionProps = () => {
  const fieldSchema = useFieldSchema();
  const { setAutoRefresh, refreshCharts } = useContext(GlobalAutoRefreshContext);
  useEffect(() => {
    setAutoRefresh(fieldSchema['x-decorator-props']?.autoRefresh);
    return () => {
      setAutoRefresh(false);
    };
  }, [fieldSchema, setAutoRefresh]);
  return {
    onClick: () => {
      refreshCharts?.();
    },
  };
};

export const BlockRefreshActionInitializer = (props) => {
  const schema = {
    'x-component': 'Action',
    'x-use-component-props': 'useChartBlockRefreshActionProps',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'chartBlockActionSettings:refresh',
    'x-component-props': {
      component: 'BlockRefreshButton',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
