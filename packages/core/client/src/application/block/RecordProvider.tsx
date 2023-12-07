import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { RecordV2 } from './Record';

export interface RecordContextValue<CurrentType = {}, ParentType = {}> {
  record: RecordV2<CurrentType, ParentType>;
}

export const RecordContextV2 = createContext<RecordContextValue<any, any>>({} as any);

export interface RecordProviderProps {
  children?: ReactNode;
  record?: RecordV2;
  current?: RecordV2;
  parent?: RecordV2;
  isNew?: boolean;
}

export const RecordProviderV2: FC<RecordProviderProps> = ({ current, parent, isNew, children }) => {
  const record = useMemo(() => {
    const parentVal = parent || current.parent;
    const isNewVal = isNew || current.isNew;
    return new RecordV2({ current, parent: parentVal, isNew: isNewVal });
  }, [current, parent, isNew]);

  return <RecordContextV2.Provider value={{ record }}>{children}</RecordContextV2.Provider>;
};

export const useRecordV2 = <CurrentType = {}, ParentType = {}>(showError = true): RecordV2<CurrentType, ParentType> => {
  const context = useContext<RecordContextValue<CurrentType, ParentType>>(RecordContextV2);

  if (showError && !context) {
    throw new Error('useRecordV2() must be used within a RecordProviderV2');
  }

  return context.record;
};
