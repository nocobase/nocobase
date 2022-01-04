import React, { createContext, useContext } from 'react';

export const RecordContext = createContext({});

export const RecordProvider: React.FC<any> = (props) => {
  const { record, children } = props;
  return <RecordContext.Provider value={record}>{children}</RecordContext.Provider>;
};

export function useRecord<D = any>() {
  return useContext(RecordContext) as D;
}
