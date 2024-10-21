/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IResource } from '@nocobase/sdk';
import { isArray } from 'lodash';
import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { useAPIClient } from '../../api-client';
import { useCollectionManager } from '../collection';
import { CollectionRecord } from '../collection-record';
import { useDataSourceHeaders } from '../utils';
import { useDataBlockProps } from './DataBlockProvider';

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
      const sourceKey = cm.getSourceKeyByAssociation(association);
      const parentRecordData = parentRecord instanceof CollectionRecord ? parentRecord.data : parentRecord;
      if (isArray(sourceKey)) {
        const filterByTk = {};
        for (const key of sourceKey) {
          filterByTk[key] = parentRecordData?.[key];
        }

        return encodeURIComponent(JSON.stringify(filterByTk));
      } else {
        return parentRecordData[sourceKey];
      }
    }
  }, [association, sourceId, parentRecord]);

  const resource = useMemo(() => {
    if (association) {
      return api.resource(association, sourceIdValue, headers, !sourceIdValue);
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
