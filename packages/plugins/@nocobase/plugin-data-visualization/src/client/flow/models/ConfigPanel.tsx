/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { useT } from '../../locale';
import { Collapse, Card } from 'antd';
import { QueryPanel } from './QueryPanel';
import { ChartOptionsPanel } from './ChartOptionsPanel';
import { EventsPanel } from './EventsPanel';

export const ConfigPanel: React.FC = () => {
  const t = useT();
  // 默认展开前两个面板（'query' 和 'chartOptions'）必填
  const [activeKeys, setActiveKeys] = useState<string | string[]>(['query', 'chartOptions']);

  // 根据当前展开数量动态分配每个面板的高度；只展开一个时占满原高度
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

  return (
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
          key: 'chartOptions',
          label: <span style={{ fontWeight: 500 }}>{t('Chart options')}</span>,
          children: (
            <Card style={getCardStyle('chartOptions')} styles={{ body: { padding: 0 } }}>
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
  );
};
