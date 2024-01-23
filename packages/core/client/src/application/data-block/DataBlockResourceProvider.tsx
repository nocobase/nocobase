import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { IResource } from '@nocobase/sdk';

import { useAPIClient } from '../../api-client';
import { useDataBlockPropsV2 } from './DataBlockProvider';
import { DEFAULT_DATA_SOURCE_NAME } from '../collection';

export const DataBlockResourceContextV2 = createContext<IResource>(null);
DataBlockResourceContextV2.displayName = 'DataBlockResourceContextV2';

export const DataBlockResourceProviderV2: FC<{ children?: ReactNode }> = ({ children }) => {
  const dataBlockProps = useDataBlockPropsV2();
  const { association, collection, dataSource, sourceId } = dataBlockProps;
  const api = useAPIClient();
  const headers = useMemo(() => {
    if (dataSource && dataSource !== DEFAULT_DATA_SOURCE_NAME) {
      return { 'x-connection': dataSource };
    }
  }, [dataSource]);
  const resource = useMemo(() => {
    if (association) {
      return api.resource(association, sourceId, headers);
    }
    return api.resource(collection, undefined, headers);
  }, [api, association, collection, sourceId, headers]);
  return <DataBlockResourceContextV2.Provider value={resource}>{children}</DataBlockResourceContextV2.Provider>;
};

export function useDataBlockResourceV2() {
  const context = useContext(DataBlockResourceContextV2);

  if (!context) {
    throw new Error('useDataBlockResourceV2() must be used within a DataBlockResourceProviderV2');
  }

  return context;
}
