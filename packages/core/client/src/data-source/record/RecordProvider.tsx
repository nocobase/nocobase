import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { Record } from './Record';

export const RecordContext = createContext<Record<any, any>>(null);
RecordContext.displayName = 'RecordContext';

export interface RecordProviderProps<DataType = {}, ParentDataType = {}> {
  children?: ReactNode;
  isNew?: boolean;
  record?: Record<DataType, ParentDataType> | DataType;
  parentRecord?: Record<ParentDataType> | DataType;
}

export const RecordProvider: FC<RecordProviderProps> = ({ isNew, record, parentRecord, children }) => {
  const parentRecordValue = useMemo(() => {
    if (parentRecord) {
      if (parentRecord instanceof Record) return parentRecord;
      return new Record({ data: parentRecord });
    }
    if (record instanceof Record) return record.parentRecord;
  }, [parentRecord, record]);

  const currentRecordValue = useMemo(() => {
    let res: Record;
    if (record) {
      if (record instanceof Record) {
        res = record;
        res.isNew = record.isNew || isNew;
      } else {
        res = new Record({ data: record, isNew });
      }
    } else {
      res = new Record({ isNew });
    }
    res.setParentRecord(parentRecordValue);
    return res;
  }, [record, parentRecordValue, isNew]);

  return <RecordContext.Provider value={currentRecordValue}>{children}</RecordContext.Provider>;
};

export function useRecord<DataType = {}, ParentDataType = {}>(): Record<DataType, ParentDataType> {
  const context = useContext<Record<DataType, ParentDataType>>(RecordContext);
  return context;
}

export function useRecordData<DataType = any>(): DataType {
  const record = useRecord<DataType>();
  return record?.data;
}

export function useParentRecord<ParentDataType>(): Record<ParentDataType> {
  const record = useRecord<any, ParentDataType>();
  return record?.parentRecord;
}

export function useParentRecordData<ParentDataType>(): ParentDataType {
  const record = useRecord<any, ParentDataType>();
  return record?.parentRecord?.data;
}
