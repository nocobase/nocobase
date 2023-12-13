import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { RecordV2 } from './Record';

export const RecordContextV2 = createContext<RecordV2<any, any>>(null);
RecordContextV2.displayName = 'RecordContextV2';

export interface RecordProviderProps<DataType = {}, ParentDataType = {}> {
  children?: ReactNode;
  record?: RecordV2<DataType, ParentDataType> | DataType;
  parentRecord?: RecordV2<ParentDataType> | DataType;
}

export const RecordProviderV2: FC<RecordProviderProps> = ({ record, parentRecord, children }) => {
  const parentRecordValue = useMemo(() => {
    if (parentRecord) {
      if (parentRecord instanceof RecordV2) return parentRecord;
      return new RecordV2(parentRecord);
    }
    if (record instanceof RecordV2) return record.parentRecord;
  }, [parentRecord, record]);

  const currentRecordValue = useMemo(() => {
    let res: RecordV2;
    if (record) {
      if (record instanceof RecordV2) {
        res = record;
      } else {
        res = new RecordV2({ data: record });
      }
    } else {
      res = new RecordV2({});
    }
    res.setParentRecord(parentRecordValue);
    return res;
  }, [parentRecordValue, record]);

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

export function useRecordDataV2<DataType>(showError = true): DataType {
  const record = useRecordV2<DataType>(showError);
  return record.data;
}

export function useParentRecordV2<ParentDataType>(showError = true): RecordV2<ParentDataType> {
  const record = useRecordV2<any, ParentDataType>(showError);
  return record.parentRecord;
}

export function useParentRecordDataV2<ParentDataType>(showError = true): ParentDataType {
  const record = useParentRecordV2<ParentDataType>(showError);
  return record.data;
}
