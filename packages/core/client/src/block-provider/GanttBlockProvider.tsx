import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect } from 'react';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';

export const GanttBlockContext = createContext<any>({});

const InternalGanttBlockProvider = (props) => {
  const { fieldNames, timeRange } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <GanttBlockContext.Provider
      value={{
        field,
        service,
        resource,
        fieldNames,
        timeRange,
      }}
    >
      {props.children}
    </GanttBlockContext.Provider>
  );
};

export const GanttBlockProvider = (props) => {
  return (
    <BlockProvider {...props} params={{ ...props.params, paginate: false }}>
      <InternalGanttBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useGanttBlockContext = () => {
  return useContext(GanttBlockContext);
};

export const useGanttBlockProps = () => {
  const ctx = useGanttBlockContext();
  const field = useField<ArrayField>();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.componentProps.dataSource = ctx?.service?.data?.data;
    }
  }, [ctx?.service?.loading]);
  return {
    fieldNames: ctx.fieldNames,
    timeRange: ctx.timeRange,
  };
};
