/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import React from 'react';

import type { RunDetailTabKey, TFunction } from '../../../pages/runs/types';

interface RunDetailTabsProps {
  t: TFunction;
  activeKey: RunDetailTabKey;
  items: TabsProps['items'];
  onChange(key: RunDetailTabKey): void;
}

export function RunDetailTabs({ t, activeKey, items, onChange }: RunDetailTabsProps) {
  return (
    <Tabs
      role="region"
      aria-label={t('Run details')}
      activeKey={activeKey}
      onChange={(key) => onChange(key as RunDetailTabKey)}
      destroyInactiveTabPane
      items={items}
    />
  );
}
