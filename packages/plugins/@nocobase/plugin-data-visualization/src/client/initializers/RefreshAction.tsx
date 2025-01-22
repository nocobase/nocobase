/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useContext, useEffect } from 'react';
import { ActionInitializer, useDesignable } from '@nocobase/client';
import { ChartRendererContext } from '../renderer';
import { Dropdown, MenuProps } from 'antd';
import { DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { useChartsTranslation } from '../locale';

export const RefreshButton: React.FC = forwardRef<HTMLButtonElement | HTMLAnchorElement, any>((props, ref) => {
  const { t } = useChartsTranslation();
  const { autoRefresh, setAutoRefresh, showActionBar } = useContext(ChartRendererContext);
  const { designable } = useDesignable();
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
  return showActionBar || designable ? (
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
      {props.children}
    </Dropdown.Button>
  ) : null;
});

export const useChartRefreshActionProps = () => {
  const fieldSchema = useFieldSchema();
  const { service, setAutoRefresh } = useContext(ChartRendererContext);
  useEffect(() => {
    setAutoRefresh(fieldSchema['x-component-props']?.autoRefresh);
    return () => {
      setAutoRefresh(false);
    };
  }, [fieldSchema, setAutoRefresh]);
  return {
    onClick: service.refresh,
  };
};

export const RefreshActionInitializer = (props) => {
  const schema = {
    'x-component': 'Action',
    'x-use-component-props': 'useChartRefreshActionProps',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'chartActionSettings:refresh',
    'x-component-props': {
      size: 'small',
      component: 'RefreshButton',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
