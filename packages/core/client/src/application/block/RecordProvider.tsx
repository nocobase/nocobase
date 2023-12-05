import React, { FC, ReactNode, createContext, useContext } from 'react';
import { RecordV2 } from './Record';

export interface RecordContextValue<CurrentType = {}, ParentType = {}> {
  record: RecordV2<CurrentType, ParentType>;
}

export const RecordContextV2 = createContext<RecordContextValue<any, any>>({} as any);

export interface RecordProviderProps extends RecordContextValue {
  children?: ReactNode;
}

export const RecordProviderV2: FC<RecordProviderProps> = ({ record, children }) => {
  return <RecordContextV2.Provider value={{ record }}>{children}</RecordContextV2.Provider>;
};

export const useRecordV2 = <CurrentType = {}, ParentType = {}>(): RecordV2<CurrentType, ParentType> => {
  const context = useContext<RecordContextValue<CurrentType, ParentType>>(RecordContextV2);

  if (!context) {
    throw new Error('useRecord() must be used within a RecordProvider');
  }

  return context.record;
};
