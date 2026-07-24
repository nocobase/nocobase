/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';

import { SharedTypeScriptWorkerOwner, type TypeScriptWorkerOwner } from './sharedTypeScriptWorkerOwner';

const TypeScriptWorkerOwnerContext = createContext<TypeScriptWorkerOwner | undefined>(undefined);

export function TypeScriptWorkerOwnerProvider({ children }: PropsWithChildren) {
  const owner = useMemo(() => new SharedTypeScriptWorkerOwner(), []);
  useEffect(() => () => owner.dispose(), [owner]);
  return <TypeScriptWorkerOwnerContext.Provider value={owner}>{children}</TypeScriptWorkerOwnerContext.Provider>;
}

export function useTypeScriptWorkerOwner(): TypeScriptWorkerOwner | undefined {
  return useContext(TypeScriptWorkerOwnerContext);
}
