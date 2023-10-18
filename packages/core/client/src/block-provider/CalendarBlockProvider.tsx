import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import _ from 'lodash';
import React, { createContext, useContext, useEffect } from 'react';
import { useRecord } from '../record-provider';
import { FixedBlockWrapper } from '../schema-component';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useParsedFilter } from './hooks';

export const CalendarBlockContext = createContext<any>({});

const InternalCalendarBlockProvider = (props) => {
  const { fieldNames, showLunar } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  const record = useRecord();

  const { filter } = useParsedFilter({
    filterOption: service?.params?.[0]?.filter,
    currentRecord: { __parent: record, __collectionName: props.collection },
  });
  useEffect(() => {
    if (!_.isEmpty(filter)) {
      service?.run({ ...service?.params?.[0], filter });
    }
  }, [JSON.stringify(filter)]);

  // if (service.loading) {
  //   return <Spin />;
  // }
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
  return (
    <BlockProvider data-testid="calendar-block" {...props} params={{ ...props.params, paginate: false }}>
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
