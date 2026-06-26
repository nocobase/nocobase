/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import type { FlowSettingsContext } from '@nocobase/flow-engine';

export type ChartSettingsExtension = {
  key: string;
  renderHeaderExtra?: (ctx: FlowSettingsContext<any>) => React.ReactNode;
  onClose?: (ctx: { model: { uid: string } }) => void;
};

const chartSettingsExtensions = new Map<string, ChartSettingsExtension>();

export const registerChartSettingsExtension = (extension: ChartSettingsExtension) => {
  chartSettingsExtensions.set(extension.key, extension);
};

export const renderChartSettingsHeaderExtra = (ctx: FlowSettingsContext<any>) => {
  const nodes = Array.from(chartSettingsExtensions.values())
    .map((extension) => {
      const node = extension.renderHeaderExtra?.(ctx);
      return node ? <React.Fragment key={extension.key}>{node}</React.Fragment> : null;
    })
    .filter(Boolean);

  return nodes.length ? <>{nodes}</> : null;
};

export const runChartSettingsCloseHandlers = (ctx: { model: { uid: string } }) => {
  chartSettingsExtensions.forEach((extension) => {
    extension.onClose?.(ctx);
  });
};
