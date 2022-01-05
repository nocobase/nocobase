import { useRequest } from 'ahooks';
import React, { createContext, useContext } from 'react';

export const RecordContext = createContext({});
export const AsyncRecordContext = createContext<any>({});

export const RecordProvider: React.FC<any> = (props) => {
  const { record, children } = props;
  return <RecordContext.Provider value={record}>{children}</RecordContext.Provider>;
};

export function useRecord<D = any>() {
  return useContext(RecordContext) as D;
}

export const AsyncRecordProvider: React.FC<any> = (props) => {
  const { record, children } = props;
  const result = useRequest(() => {
    console.log('aaa');
    return Promise.resolve({});
  });
  return <AsyncRecordContext.Provider value={{ ...result }}>{children}</AsyncRecordContext.Provider>;
};
