/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, createContext, useContext, useState } from 'react';

interface SizeContextProps {
  size: { width: number; height: number };
  setSize: (size: { width: number; height: number }) => void;
}

const SizeContext = createContext<SizeContextProps>(null);
SizeContext.displayName = 'SizeContext';

export function useSize() {
  return useContext(SizeContext);
}

interface SizeContextProviderProps {
  children?: React.ReactNode;
}

export const SizeContextProvider: FC<SizeContextProviderProps> = ({ children }) => {
  const [size, setSize] = useState<SizeContextProps['size']>({ width: 375, height: 667 });
  return <SizeContext.Provider value={{ size, setSize }}>{children}</SizeContext.Provider>;
};
