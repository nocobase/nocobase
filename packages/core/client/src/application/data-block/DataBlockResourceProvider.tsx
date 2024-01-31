import { IResource } from '@nocobase/sdk';
import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { useAPIClient } from '../../api-client';
import { useCollectionManagerV2 } from '../collection/CollectionManagerProvider';
import { RecordV2 } from '../collection/Record';
import { useDataSourceHeaders } from '../collection/utils';
import { useDataBlockPropsV2 } from './DataBlockProvider';

export const DataBlockResourceContextV2 = createContext<IResource>(null);
DataBlockResourceContextV2.displayName = 'DataBlockResourceContextV2';

export const DataBlockResourceProviderV2: FC<{ children?: ReactNode }> = ({ children }) => {
  const dataBlockProps = useDataBlockPropsV2();
  const cm = useCollectionManagerV2();
  const { association, collection, dataSource, sourceId, parentRecord } = dataBlockProps;
  const api = useAPIClient();
  const headers = useDataSourceHeaders(dataSource);

  const sourceIdValue = useMemo(() => {
    if (sourceId) {
      return sourceId;
    }
    if (association && parentRecord) {
      const associationCollection = cm.getCollection(association);
      if (associationCollection) {
        const parentRecordData = parentRecord instanceof RecordV2 ? parentRecord.data : parentRecord;
        return parentRecordData[associationCollection.sourceKey || 'id'];
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
