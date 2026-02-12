/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useContext } from 'react';
import { ToolsContext } from './context';

export const useTools = () => {
  const ctx = useContext(ToolsContext);
  if (!ctx) {
    throw new Error('useTools must be used within a ToolsProvider');
  }
  return ctx;
};

export * from './context';
export * from './provider';
