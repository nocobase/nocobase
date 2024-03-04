import { IResource } from '@nocobase/sdk';
import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { useCollectionManager } from '../collection';
import { useDataBlockProps } from './DataBlockProvider';
import { useAPIClient } from '../../api-client';
import { CollectionRecord } from '../collection-record';
import { useDataSourceHeaders } from '../utils';

export const DataBlockResourceContext = createContext<IResource>(null);
DataBlockResourceContext.displayName = 'DataBlockResourceContext';

export const DataBlockResourceProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const dataBlockProps = useDataBlockProps();
  const cm = useCollectionManager();
  const { association, collection, dataSource, sourceId, parentRecord } = dataBlockProps;
  const api = useAPIClient();
  const headers = useDataSourceHeaders(dataSource);
  const collectionName = useMemo(() => (typeof collection === 'string' ? collection : collection?.name), [collection]);

  const sourceIdValue = useMemo(() => {
    if (sourceId) {
      return sourceId;
    }
    if (association && parentRecord) {
      const associationCollection = cm.getCollection(association);
      if (associationCollection) {
        const parentRecordData = parentRecord instanceof CollectionRecord ? parentRecord.data : parentRecord;
        return parentRecordData[associationCollection.sourceKey || 'id'];
      }
    }
  }, [sourceId, parentRecord]);

  const resource = useMemo(() => {
    if (association) {
      return api.resource(association, sourceIdValue, headers);
    }
    return api.resource(collectionName, undefined, headers);
  }, [api, association, collection, sourceIdValue, headers]);
  return <DataBlockResourceContext.Provider value={resource}>{children}</DataBlockResourceContext.Provider>;
};

export function useDataBlockResource() {
  const context = useContext(DataBlockResourceContext);

  if (!context) {
    throw new Error('useDataBlockResource() must be used within a DataBlockResourceProvider');
  }

  return context;
}
