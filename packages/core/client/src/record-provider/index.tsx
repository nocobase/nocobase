import React, { createContext, useContext } from 'react';
import { useCollection } from '../collection-manager';
import { useCurrentUserContext } from '../user';

export const RecordContext = createContext({});
export const RecordIndexContext = createContext(null);

export const RecordProvider: React.FC<{ record: any; parent?: any; collectionName?: string }> = (props) => {
  const { record, children, collectionName, parent = false } = props;
  const { name: __collectionName } = useCollection();
  const __parent = useContext(RecordContext);
  const value = { ...record };
  value['__parent'] = parent ? parent : __parent;
  value['__collectionName'] = collectionName || __collectionName;
  return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>;
};

export const RecordSimpleProvider: React.FC<{ value: Record<string, any>; children: React.ReactNode }> = (props) => {
  return <RecordContext.Provider {...props} />;
};

export const RecordIndexProvider: React.FC<{ index: any }> = (props) => {
  const { index, children } = props;
  return <RecordIndexContext.Provider value={index}>{children}</RecordIndexContext.Provider>;
};

export function useRecord<D = any>() {
  return useContext(RecordContext) as D;
}

export function useRecordIndex() {
  return useContext(RecordIndexContext);
}

export const useRecordIsOwn = () => {
  const record = useRecord();
  const ctx = useCurrentUserContext();
  if (!record?.createdById) {
    return false;
  }
  return record?.createdById === ctx?.data?.data?.id;
};
