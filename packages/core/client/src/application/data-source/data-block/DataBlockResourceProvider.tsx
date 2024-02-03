import { IResource } from '@nocobase/sdk';
import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { useCollectionManagerV3 } from '../collection';
import { useDataBlockPropsV3 } from './DataBlockProvider';
import { useAPIClient } from '../../../api-client';
import { RecordV3 } from '../record';
import { useDataSourceHeadersV3 } from '../utils';

export const DataBlockResourceContextV3 = createContext<IResource>(null);
DataBlockResourceContextV3.displayName = 'DataBlockResourceContextV3';

export const DataBlockResourceProviderV3: FC<{ children?: ReactNode }> = ({ children }) => {
  const dataBlockProps = useDataBlockPropsV3();
  const cm = useCollectionManagerV3();
  const { association, collection, dataSource, sourceId, parentRecord } = dataBlockProps;
  const api = useAPIClient();
  const headers = useDataSourceHeadersV3(dataSource);
  const collectionName = useMemo(() => (typeof collection === 'string' ? collection : collection?.name), [collection]);

  const sourceIdValue = useMemo(() => {
    if (sourceId) {
      return sourceId;
    }
    if (association && parentRecord) {
      const associationCollection = cm.getCollection(association);
      if (associationCollection) {
        const parentRecordData = parentRecord instanceof RecordV3 ? parentRecord.data : parentRecord;
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
  return <DataBlockResourceContextV3.Provider value={resource}>{children}</DataBlockResourceContextV3.Provider>;
};

export function useDataBlockResourceV3() {
  const context = useContext(DataBlockResourceContextV3);

  if (!context) {
    throw new Error('useDataBlockResourceV3() must be used within a DataBlockResourceProviderV3');
  }

  return context;
}
