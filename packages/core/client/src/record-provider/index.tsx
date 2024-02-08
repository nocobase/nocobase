import React, { createContext, useContext } from 'react';
import { useCollection } from '../collection-manager';
import { RecordProviderV2 } from '../data-source';
import { useCurrentUserContext } from '../user';

export const RecordContext = createContext({});
export const RecordIndexContext = createContext(null);

/**
 * @deprecated
 * @param props
 * @returns
 */
export const RecordProvider: React.FC<{
  record: any;
  parent?: any;
  isNew?: boolean;
}> = (props) => {
  const { record, children, parent, isNew } = props;
  const { name: __collectionName } = useCollection();
  const value = { ...record };
  value['__parent'] = parent;
  value['__collectionName'] = __collectionName;
  return (
    <RecordContext.Provider value={value}>
      <RecordProviderV2 isNew={isNew} record={record} parentRecord={parent}>
        {children}
      </RecordProviderV2>
    </RecordContext.Provider>
  );
};

export const RecordSimpleProvider: React.FC<{ value: Record<string, any>; children: React.ReactNode }> = (props) => {
  return <RecordContext.Provider {...props} />;
};

export const RecordIndexProvider: React.FC<{ index: any }> = (props) => {
  const { index, children } = props;
  return <RecordIndexContext.Provider value={index}>{children}</RecordIndexContext.Provider>;
};

/**
 * @deprecated
 * @returns
 */
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
