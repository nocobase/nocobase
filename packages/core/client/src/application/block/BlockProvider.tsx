import React, { FC, ReactNode, createContext, useContext } from 'react';

interface BlockContextValue {
  collection: string;
  action: string;
  params?: Record<string, any>;
  sourceId?: string;
  association?: string;
  useParams?: string;
  useSourceId?: string;
  [index: string]: any;
}

export const BlockContextV2 = createContext<BlockContextValue>({} as any);

export interface BlockProviderProps extends BlockContextValue {
  children?: ReactNode;
}

export const BlockProviderV2: FC<BlockProviderProps> = ({ children, ...resets }) => {
  return <BlockContextV2.Provider value={resets}>{children}</BlockContextV2.Provider>;
};

export const useBlockDataV2 = <T extends {}>(): T & BlockContextValue => {
  const context = useContext(BlockContextV2) as T & BlockContextValue;
  if (!context) {
    throw new Error('useBlockData() must be used within a BlockProvider');
  }

  return context;
};
