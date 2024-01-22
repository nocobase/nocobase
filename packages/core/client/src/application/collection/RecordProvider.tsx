import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { RecordV2 } from './Record';

export const RecordContextV2 = createContext<RecordV2<any, any>>(null);
RecordContextV2.displayName = 'RecordContextV2';

export interface RecordProviderProps<DataType = {}, ParentDataType = {}> {
  children?: ReactNode;
  isNew?: boolean;
  record?: RecordV2<DataType, ParentDataType> | DataType;
  parentRecord?: RecordV2<ParentDataType> | DataType;
  /**
   * 当前记录所属的 collection name
   */
  collectionName?: string;
}

export const RecordProviderV2: FC<RecordProviderProps> = ({
  isNew,
  record,
  parentRecord,
  children,
  collectionName,
}) => {
  const parentRecordValue = useMemo(() => {
    if (parentRecord) {
      if (parentRecord instanceof RecordV2) return parentRecord;
      return new RecordV2({ data: parentRecord, collectionName });
    }
    if (record instanceof RecordV2) return record.parentRecord;
  }, [collectionName, parentRecord, record]);

  const currentRecordValue = useMemo(() => {
    let res: RecordV2;
    if (record) {
      if (record instanceof RecordV2) {
        res = record;
        res.isNew = record.isNew || isNew;
      } else {
        res = new RecordV2({ data: record, isNew, collectionName });
      }
    } else {
      res = new RecordV2({ isNew, collectionName });
    }
    res.setParentRecord(parentRecordValue);
    return res;
  }, [record, parentRecordValue, isNew, collectionName]);

  return <RecordContextV2.Provider value={currentRecordValue}>{children}</RecordContextV2.Provider>;
};

export function useRecordV2<DataType = {}, ParentDataType = {}>(
  showErrorWhenNotExists = true,
): RecordV2<DataType, ParentDataType> {
  const context = useContext<RecordV2<DataType, ParentDataType>>(RecordContextV2);

  if (showErrorWhenNotExists && !context) {
    throw new Error('useRecordV2() must be used within a RecordProviderV2');
  }

  return context;
}

export function useRecordDataV2<DataType>(showErrorWhenNotExists = true): DataType {
  const record = useRecordV2<DataType>(showErrorWhenNotExists);
  return record.data;
}

export function useParentRecordV2<ParentDataType>(showErrorWhenNotExists = true): RecordV2<ParentDataType> {
  const record = useRecordV2<any, ParentDataType>(showErrorWhenNotExists);
  return record.parentRecord;
}

export function useParentRecordDataV2<ParentDataType>(showErrorWhenNotExists = true): ParentDataType {
  const record = useRecordV2<any, ParentDataType>(showErrorWhenNotExists);
  return record.parentRecord?.data;
}
