import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect } from 'react';
import { BlockProvider, useBlockResource, useResourceAction } from './BlockProvider';

export const CalendarBlockContext = createContext<any>({});

const InternalCalendarBlockProvider = (props) => {
  const { fieldNames } = props;
  const field = useField();
  const resource = useBlockResource();
  const service = useResourceAction({ ...props, resource });
  if (service.loading) {
    return <Spin />;
  }
  return (
    <CalendarBlockContext.Provider
      value={{
        field,
        service,
        resource,
        fieldNames,
      }}
    >
      {props.children}
    </CalendarBlockContext.Provider>
  );
};

export const CalendarBlockProvider = (props) => {
  return (
    <BlockProvider {...props}>
      <InternalCalendarBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useCalendarBlockContext = () => {
  return useContext(CalendarBlockContext);
};

export const useCalendarBlockProps = () => {
  const ctx = useCalendarBlockContext();
  const field = useField<ArrayField>();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = ctx?.service?.data?.data;
      console.log(field.value);
    }
    field.loading = ctx?.service?.loading;
  }, [ctx?.service?.loading]);
  return {
    fieldNames: ctx.fieldNames,
  };
};
