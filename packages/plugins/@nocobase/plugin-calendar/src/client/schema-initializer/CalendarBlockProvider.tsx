import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { BlockProvider, FixedBlockWrapper, useBlockRequestContext, useParsedFilter } from '@nocobase/client';
import _ from 'lodash';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCalendarBlockParams } from '../hooks/useCalendarBlockParams';

export const CalendarBlockContext = createContext<any>({});
CalendarBlockContext.displayName = 'CalendarBlockContext';

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
  const params = useCalendarBlockParams(props);
  return (
    <BlockProvider name="calendar" {...props} params={params}>
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
