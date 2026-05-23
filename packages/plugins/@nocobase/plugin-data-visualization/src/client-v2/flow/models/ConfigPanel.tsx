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
import { Collapse, Card } from 'antd';
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

  const getCardStyle = (panelKey: string) => {
    const keys = Array.isArray(activeKeys) ? activeKeys : [activeKeys];
    const isOpen = keys.includes(panelKey);
    const openedCount = Math.max(keys.length, 1);
    const height = openedCount > 0 ? `calc((100vh - 288px) / ${openedCount})` : 'calc(100vh - 288px)';
    return {
      height: isOpen ? height : undefined,
      overflow: 'auto',
      border: 'none',
    } as React.CSSProperties;
  };

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
            label: <span style={{ fontWeight: 500 }}>{t('Data query')}</span>,
            children: (
              <Card style={getCardStyle('query')} styles={{ body: { padding: 0 } }}>
                <QueryPanel />
              </Card>
            ),
          },
          {
            key: 'chartOption',
            label: <span style={{ fontWeight: 500 }}>{t('Chart options')}</span>,
            children: (
              <Card style={getCardStyle('chartOption')} styles={{ body: { padding: 0 } }}>
                <ChartOptionsPanel />
              </Card>
            ),
          },
          {
            key: 'events',
            label: <span style={{ fontWeight: 500 }}>{t('Events')}</span>,
            children: (
              <Card style={getCardStyle('events')} styles={{ body: { padding: 0 } }}>
                <EventsPanel />
              </Card>
            ),
          },
        ]}
      />
    </>
  );
};
