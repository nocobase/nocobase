/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import { SchemaSettingsSelectItem } from '@nocobase/client';
import React from 'react';
import { useChartsTranslation } from '../locale';

export const AutoRefreshItem: React.FC<{
  value: number | boolean;
  onChange?: (value: any) => void;
}> = (props) => {
  const { t } = useChartsTranslation();
  return (
    <SchemaSettingsSelectItem
      title={t('Auto refresh')}
      value={props.value}
      onChange={props.onChange}
      options={[
        {
          label: t('Off'),
          value: false,
        },
        {
          label: '5s',
          value: 5,
        },
        {
          label: '10s',
          value: 10,
        },
        {
          label: '30s',
          value: 30,
        },
        {
          label: '1m',
          value: 60,
        },
        {
          label: '5m',
          value: 300,
        },
        {
          label: '15m',
          value: 900,
        },
        {
          label: '30m',
          value: 1800,
        },
        {
          label: '1h',
          value: 3600,
        },
        {
          label: '2h',
          value: 7200,
        },
        {
          label: '1d',
          value: 86400,
        },
      ]}
    />
  );
};
