/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { CollectionRecord } from './CollectionRecord';

export const CollectionRecordContext = createContext<CollectionRecord<any, any>>(null);
CollectionRecordContext.displayName = 'CollectionRecordContext';

export interface CollectionRecordProviderProps<DataType = {}, ParentDataType = {}> {
  children?: ReactNode;
  isNew?: boolean;
  record?: CollectionRecord<DataType, ParentDataType> | DataType;
  parentRecord?: CollectionRecord<ParentDataType> | DataType;
}

export const CollectionRecordProvider: FC<CollectionRecordProviderProps> = React.memo(
  ({ isNew, record, parentRecord, children }) => {
    const parentRecordValue = useMemo(() => {
      if (parentRecord) {
        if (parentRecord instanceof CollectionRecord) return parentRecord;
        return new CollectionRecord({ data: parentRecord });
      }
      if (record instanceof CollectionRecord) return record.parentRecord;
    }, [parentRecord, record]);

    const currentRecordValue = useMemo(() => {
      let res: CollectionRecord;
      if (record) {
        if (record instanceof CollectionRecord) {
          res = record;
          res.isNew = record.isNew || isNew;
        } else {
          res = new CollectionRecord({ data: record, isNew });
        }
      } else {
        res = new CollectionRecord({ isNew });
      }
      res.setParentRecord(parentRecordValue);
      return res;
    }, [record, parentRecordValue, isNew]);

    return <CollectionRecordContext.Provider value={currentRecordValue}>{children}</CollectionRecordContext.Provider>;
  },
);

CollectionRecordProvider.displayName = 'CollectionRecordProvider';

export function useCollectionRecord<DataType = {}, ParentDataType = {}>(): CollectionRecord<DataType, ParentDataType> {
  const context = useContext<CollectionRecord<DataType, ParentDataType>>(CollectionRecordContext);
  return context;
}

export function useCollectionRecordData<DataType = any>(): DataType {
  const record = useCollectionRecord<DataType>();
  return record?.data;
}

export function useCollectionParentRecord<ParentDataType>(): CollectionRecord<ParentDataType> {
  const record = useCollectionRecord<any, ParentDataType>();
  return record?.parentRecord;
}

export function useCollectionParentRecordData<ParentDataType>(): ParentDataType {
  const record = useCollectionRecord<any, ParentDataType>();
  return record?.parentRecord?.data;
}
