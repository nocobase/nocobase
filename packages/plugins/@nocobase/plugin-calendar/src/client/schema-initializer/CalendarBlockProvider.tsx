import { ArrayField } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import {
  BlockProvider,
  FixedBlockWrapper,
  useBlockRequestContext,
  useParsedFilter,
  withDynamicSchemaProps,
} from '@nocobase/client';
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

const useCompatCalendarBlockParams = (props) => {
  const fieldSchema = useFieldSchema();

  // 因为 x-use-decorator-props 的值是固定不变的，所以可以在条件中使用 hooks
  if (fieldSchema['x-use-decorator-props']) {
    return props.params;
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCalendarBlockParams(props);
  }
};

export const CalendarBlockProvider = withDynamicSchemaProps((props) => {
  const params = useCompatCalendarBlockParams(props);
  return (
    <BlockProvider name="calendar" {...props} params={params}>
      <InternalCalendarBlockProvider {...props} />
    </BlockProvider>
  );
});

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
