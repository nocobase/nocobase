import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { RecordV3 } from './Record';

export const RecordContextV3 = createContext<RecordV3<any, any>>(null);
RecordContextV3.displayName = 'RecordContextV3';

export interface RecordProviderPropsV3<DataType = {}, ParentDataType = {}> {
  children?: ReactNode;
  isNew?: boolean;
  record?: RecordV3<DataType, ParentDataType> | DataType;
  parentRecord?: RecordV3<ParentDataType> | DataType;
  /**
   * 当前记录所属的 collection name
   */
  collectionName?: string;
}

export const RecordProviderV3: FC<RecordProviderPropsV3> = ({
  isNew,
  record,
  parentRecord,
  children,
  collectionName,
}) => {
  const parentRecordValue = useMemo(() => {
    if (parentRecord) {
      if (parentRecord instanceof RecordV3) return parentRecord;
      return new RecordV3({ data: parentRecord, collectionName });
    }
    if (record instanceof RecordV3) return record.parentRecord;
  }, [collectionName, parentRecord, record]);

  const currentRecordValue = useMemo(() => {
    let res: RecordV3;
    if (record) {
      if (record instanceof RecordV3) {
        res = record;
        res.isNew = record.isNew || isNew;
      } else {
        res = new RecordV3({ data: record, isNew, collectionName });
      }
    } else {
      res = new RecordV3({ isNew, collectionName });
    }
    res.setParentRecord(parentRecordValue);
    return res;
  }, [record, parentRecordValue, isNew, collectionName]);

  return <RecordContextV3.Provider value={currentRecordValue}>{children}</RecordContextV3.Provider>;
};

export function useRecordV3<DataType = {}, ParentDataType = {}>(
  showErrorWhenNotExists = true,
): RecordV3<DataType, ParentDataType> {
  const context = useContext<RecordV3<DataType, ParentDataType>>(RecordContextV3);

  if (showErrorWhenNotExists && !context) {
    throw new Error('useRecordV3() must be used within a RecordProviderV3');
  }

  return context;
}

export function useRecordDataV3<DataType = any>(showErrorWhenNotExists = true): DataType {
  const record = useRecordV3<DataType>(showErrorWhenNotExists);
  return record.data;
}

export function useParentRecordV3<ParentDataType>(showErrorWhenNotExists = true): RecordV3<ParentDataType> {
  const record = useRecordV3<any, ParentDataType>(showErrorWhenNotExists);
  return record.parentRecord;
}

export function useParentRecordDataV3<ParentDataType>(showErrorWhenNotExists = true): ParentDataType {
  const record = useRecordV3<any, ParentDataType>(showErrorWhenNotExists);
  return record.parentRecord?.data;
}
