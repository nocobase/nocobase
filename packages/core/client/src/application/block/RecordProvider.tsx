import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { RecordV2 } from './Record';

export interface RecordContextValue<CurrentType = {}, ParentType = {}> {
  record: RecordV2<CurrentType, ParentType>;
}

export const RecordContextV2 = createContext<RecordContextValue<any, any>>({} as any);

export interface RecordProviderProps<CurrentType = {}, ParentType = {}> {
  children?: ReactNode;
  current?: CurrentType;
  record?: RecordV2<CurrentType, ParentType>;
  parent?: ParentType;
  parentRecord?: RecordV2<ParentType>;
  isNew?: boolean;
}

export const RecordProviderV2: FC<RecordProviderProps> = ({
  record,
  current,
  parent,
  isNew,
  parentRecord,
  children,
}) => {
  const parentRecordValue = useMemo(() => {
    if (parentRecord) return parentRecord;
    if (parent) return new RecordV2(parent);
    return record?.parentRecord;
  }, [parent, parentRecord, record?.parentRecord]);

  const currentRecordValue = useMemo(() => {
    const isNewVal = isNew || record?.isNew;
    const currentVal = current || record?.current;
    return new RecordV2({ current: currentVal, parentRecord: parentRecordValue, isNew: isNewVal });
  }, [parentRecordValue, record, isNew, current]);

  return <RecordContextV2.Provider value={{ record: currentRecordValue }}>{children}</RecordContextV2.Provider>;
};

export const useRecordV2 = <CurrentType = {}, ParentType = {}>(showError = true): RecordV2<CurrentType, ParentType> => {
  const context = useContext<RecordContextValue<CurrentType, ParentType>>(RecordContextV2);

  if (showError && !context) {
    throw new Error('useRecordV2() must be used within a RecordProviderV2');
  }

  return context.record;
};
