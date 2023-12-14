import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { IResource } from '@nocobase/sdk';

import { useAPIClient } from '../../api-client';
import { useDataBlockPropsV2 } from './DataBlockProvider';

export const DataBlockResourceContextV2 = createContext<IResource>(null);
DataBlockResourceContextV2.displayName = 'DataBlockResourceContextV2';

export const DataBlockResourceProviderV2: FC<{ children?: ReactNode }> = ({ children }) => {
  const dataBlockProps = useDataBlockPropsV2();
  const { association, collection, sourceId } = dataBlockProps;
  const api = useAPIClient();
  const resource = useMemo(() => {
    if (association) {
      return api.resource(association, sourceId);
    }
    return api.resource(collection);
  }, [api, association, collection, sourceId]);
  return <DataBlockResourceContextV2.Provider value={resource}>{children}</DataBlockResourceContextV2.Provider>;
};

export function useDataBlockResourceV2() {
  const context = useContext(DataBlockResourceContextV2);

  if (!context) {
    throw new Error('useDataBlockResourceV2() must be used within a DataBlockResourceProviderV2');
  }

  return context;
}
