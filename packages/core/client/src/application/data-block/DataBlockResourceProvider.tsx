import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { IResource } from '@nocobase/sdk';

import { useAPIClient } from '../../api-client';
import { useDataBlockPropsV2 } from './DataBlockProvider';
import { DEFAULT_DATA_SOURCE_NAME, useCollectionManagerV2 } from '../collection';

export const DataBlockResourceContextV2 = createContext<IResource>(null);
DataBlockResourceContextV2.displayName = 'DataBlockResourceContextV2';

export const DataBlockResourceProviderV2: FC<{ children?: ReactNode }> = ({ children }) => {
  const dataBlockProps = useDataBlockPropsV2();
  const cm = useCollectionManagerV2();
  const { association, collection, dataSource, sourceId, parentRecord } = dataBlockProps;
  const api = useAPIClient();
  const headers = useMemo(() => {
    if (dataSource && dataSource !== DEFAULT_DATA_SOURCE_NAME) {
      return { 'x-connection': dataSource };
    }
  }, [dataSource]);

  const sourceIdValue = useMemo(() => {
    if (sourceId) {
      return sourceId;
    }
    if (association && parentRecord) {
      const associationCollection = cm.getCollection(association);
      if (associationCollection) {
        return parentRecord.data[associationCollection.sourceKey || 'id'];
      }
    }
  }, [sourceId, parentRecord]);

  const resource = useMemo(() => {
    if (association) {
      return api.resource(association, sourceIdValue, headers);
    }
    return api.resource(collection, undefined, headers);
  }, [api, association, collection, sourceIdValue, headers]);
  return <DataBlockResourceContextV2.Provider value={resource}>{children}</DataBlockResourceContextV2.Provider>;
};

export function useDataBlockResourceV2() {
  const context = useContext(DataBlockResourceContextV2);

  if (!context) {
    throw new Error('useDataBlockResourceV2() must be used within a DataBlockResourceProviderV2');
  }

  return context;
}
