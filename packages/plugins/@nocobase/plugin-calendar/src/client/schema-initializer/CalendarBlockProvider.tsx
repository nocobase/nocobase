import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { BlockProvider, FixedBlockWrapper, useBlockRequestContext, useParsedFilter } from '@nocobase/client';
import _ from 'lodash';
import React, { createContext, useContext, useEffect, useMemo } from 'react';

export const CalendarBlockContext = createContext<any>({});

const InternalCalendarBlockProvider = (props) => {
  const { fieldNames, showLunar } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  const { filter } = useParsedFilter({
    filterOption: service?.params?.[0]?.filter,
  });
  useEffect(() => {
    if (!_.isEmpty(filter)) {
      service?.run({ ...service?.params?.[0], filter });
    }
  }, [JSON.stringify(filter)]);

  return (
    <FixedBlockWrapper>
      <CalendarBlockContext.Provider
        value={{
          field,
          service,
          resource,
          fieldNames,
          showLunar,
          fixedBlock: field?.decoratorProps?.fixedBlock,
        }}
      >
        {props.children}
      </CalendarBlockContext.Provider>
    </FixedBlockWrapper>
  );
};

export const CalendarBlockProvider = (props) => {
  const appends = useMemo(() => {
    const arr: string[] = [];
    const start = props.fieldNames?.start;
    const end = props.fieldNames?.end;

    if (Array.isArray(start) && start.length >= 2) {
      arr.push(start[0]);
    }
    if (Array.isArray(end) && end.length >= 2) {
      arr.push(end[0]);
    }

    return arr;
  }, [props.fieldNames]);
  return (
    <BlockProvider
      name="calendar"
      {...props}
      params={{ ...props.params, appends: [...appends, ...(props.params.appends || [])], paginate: false }}
    >
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
      field.componentProps.dataSource = ctx?.service?.data?.data;
    }
  }, [ctx?.service?.loading]);
  return {
    fieldNames: ctx.fieldNames,
    showLunar: ctx.showLunar,
    fixedBlock: ctx.fixedBlock,
  };
};
