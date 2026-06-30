/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { getWorkflowSingleton } from '../utils/contextSingleton';

export type SharedAddNodeAnchor = {
  upstream?: any;
  branchIndex?: number | null;
  branchContext?: {
    syncOnly?: boolean;
  } | null;
};

export type SharedAddNodeContextValue = {
  creating?: { upstreamId: any; branchIndex: number | null } | null;
  anchor?: SharedAddNodeAnchor | null;
  onMenuOpen?: (anchor: SharedAddNodeAnchor) => void;
  onMenuCancel?: () => void;
  onCreate?: (args: SharedAddNodeAnchor & { type: string }) => Promise<void> | void;
  presetting?: any;
  setPresetting?: (value: any) => void;
  setCreating?: (value: any) => void;
};

export const AddNodeContext = getWorkflowSingleton('AddNodeContext', () =>
  createContext<SharedAddNodeContextValue | null>(null),
);

export function useAddNodeContext() {
  return useContext(AddNodeContext);
}
