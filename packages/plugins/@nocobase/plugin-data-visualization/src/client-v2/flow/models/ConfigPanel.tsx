/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { useT } from '../../locale';
import { Collapse } from 'antd';
import { QueryPanel } from './QueryPanel';
import { ChartOptionsPanel } from './ChartOptionsPanel';
import { EventsPanel } from './EventsPanel';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client-v2';

const getFormValues = (ctx: any) => ctx.getStepFormValues('chartSettings', 'configure') || {};

const setIn = (target: any, path: string[], value: any) => {
  let cursor = target;
  path.slice(0, -1).forEach((key) => {
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  });
  cursor[path[path.length - 1]] = value;
};

export const ConfigPanel: React.FC = () => {
  const t = useT();
  const ctx = useFlowSettingsContext<any>();
  const [activeKeys, setActiveKeys] = useState<string | string[]>(['query', 'chartOption']);

  useEffect(() => {
    ctx?.defineMethod?.('writeSql', async (sql: string, dataSource?: string) => {
      const values = getFormValues(ctx);
      const dsKey = dataSource || values?.query?.sqlDatasource || DEFAULT_DATA_SOURCE_KEY;
      setIn(values, ['query', 'mode'], 'sql');
      setIn(values, ['query', 'sql'], sql);
      setIn(values, ['query', 'sqlDatasource'], dsKey);
      return ctx.model.onPreview(values, true);
    });

    ctx?.defineMethod?.('writeChartConfig', async (raw: string) => {
      const values = getFormValues(ctx);
      setIn(values, ['chart', 'option', 'mode'], 'custom');
      setIn(values, ['chart', 'option', 'raw'], raw);
      return ctx.model.onPreview(values);
    });

    ctx?.defineMethod?.('writeChartEvents', async (raw: string) => {
      const values = getFormValues(ctx);
      setIn(values, ['chart', 'events', 'mode'], 'custom');
      setIn(values, ['chart', 'events', 'raw'], raw);
      return ctx.model.onPreview(values);
    });
  }, [ctx]);

  return (
    <>
      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        items={[
          {
            key: 'query',
            label: t('Data query'),
            children: <QueryPanel />,
          },
          {
            key: 'chartOption',
            label: t('Chart options'),
            children: <ChartOptionsPanel />,
          },
          {
            key: 'events',
            label: t('Events'),
            children: <EventsPanel />,
          },
        ]}
      />
    </>
  );
};
