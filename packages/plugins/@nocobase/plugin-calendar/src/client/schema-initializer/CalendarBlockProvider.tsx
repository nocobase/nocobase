/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { BlockProvider, FixedBlockWrapper, useBlockRequestContext, withDynamicSchemaProps } from '@nocobase/client';
import React, { createContext, useContext, useEffect } from 'react';
import { useCalendarBlockParams } from '../hooks/useCalendarBlockParams';

export const CalendarBlockContext = createContext<any>({});
CalendarBlockContext.displayName = 'CalendarBlockContext';

const InternalCalendarBlockProvider = (props) => {
  const { fieldNames, showLunar, defaultView } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();

  return (
    <FixedBlockWrapper>
      <CalendarBlockContext.Provider
        value={{
          field,
          service,
          resource,
          fieldNames,
          showLunar,
          defaultView,
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
    return { params: props.params, parseVariableLoading: props.parseVariableLoading };
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCalendarBlockParams(props);
  }
};

export const CalendarBlockProvider = withDynamicSchemaProps(
  (props) => {
    const { params, parseVariableLoading } = useCompatCalendarBlockParams(props);

    if (parseVariableLoading) {
      return null;
    }

    return (
      <BlockProvider name="calendar" {...props} params={params}>
        <InternalCalendarBlockProvider {...props} />
      </BlockProvider>
    );
  },
  { displayName: 'CalendarBlockProvider' },
);

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
    defaultView: ctx.defaultView,
  };
};
