/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext } from 'react';
import { ToolsEntry } from '../types';

export interface ToolsContextValue {
  tools: ToolsEntry[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const ToolsContext = createContext<ToolsContextValue | null>(null);
