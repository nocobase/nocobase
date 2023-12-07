import React, { FC, ReactNode, createContext, useContext } from 'react';
import { RecordV2 } from './Record';
import { Designable } from '../../schema-component';

export interface BlockContextProps {
  collection: string;
  association: string;
  sourceId: string | number;
  filterByTk: string | number;
  record: RecordV2;
  action?: string;
  params?: Record<string, any>;
  parentRecord?: RecordV2;
  type: string;
  [index: string]: any;
}

interface BlockContextValue<T = {}> {
  props: BlockContextProps & T;
  dn: Designable;
}

export const BlockContextV2 = createContext<BlockContextValue>({} as any);

export interface BlockProviderProps extends BlockContextValue {
  children?: ReactNode;
}

export const BlockProviderV2: FC<BlockProviderProps> = ({ children, dn, props }) => {
  return <BlockContextV2.Provider value={{ dn, props }}>{children}</BlockContextV2.Provider>;
};

export const useBlockV2 = <T extends {}>(showError = true): BlockContextValue<T> => {
  const context = useContext(BlockContextV2) as BlockContextValue<T>;
  if (showError && !context) {
    throw new Error('useBlockData() must be used within a BlockProvider');
  }

  return context;
};
