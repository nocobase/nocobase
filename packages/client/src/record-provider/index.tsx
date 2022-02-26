import React, { createContext, useContext } from 'react';

export const RecordContext = createContext({});
export const RecordIndexContext = createContext(null);

export const RecordProvider: React.FC<{ record: any }> = (props) => {
  const { record, children } = props;
  return <RecordContext.Provider value={record}>{children}</RecordContext.Provider>;
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
