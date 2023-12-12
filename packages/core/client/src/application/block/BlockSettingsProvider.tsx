import React, { FC, ReactNode, createContext, useContext } from 'react';
import { RecordV2 } from './Record';
import { Designable } from '../../schema-component';

export interface BlockSettingsContextProps {
  collection: string;
  association: string;
  sourceId: string | number;
  filterByTk: string | number;
  record: RecordV2;
  action?: 'list' | 'get';
  params?: Record<string, any>;
  parentRecord?: RecordV2;
  type: string;
  [index: string]: any;
}

interface BlockSettingsContextValue<T = {}> {
  props: BlockSettingsContextProps & T;
  dn: Designable;
  changeSchemaProps: any;
}

export const BlockSettingsContextV2 = createContext<BlockSettingsContextValue>({} as any);
BlockSettingsContextV2.displayName = 'BlockSettingsContextV2';

export interface BlockSettingsProviderProps extends BlockSettingsContextValue {
  children?: ReactNode;
}

export const BlockSettingsProviderV2: FC<BlockSettingsProviderProps> = ({ children, changeSchemaProps, dn, props }) => {
  return (
    <BlockSettingsContextV2.Provider value={{ changeSchemaProps, dn, props }}>
      {children}
    </BlockSettingsContextV2.Provider>
  );
};

export const useBlockSettingsV2 = <T extends {}>(showError = true): BlockSettingsContextValue<T> => {
  const context = useContext(BlockSettingsContextV2) as BlockSettingsContextValue<T>;
  if (showError && !context) {
    throw new Error('useBlockSettings() must be used within a BlockSettingsProvider');
  }

  return context;
};
