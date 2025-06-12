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
import { BlockProvider, useBlockRequestContext, withDynamicSchemaProps, useApp, useCollection } from '@nocobase/client';
import React, { createContext, useContext, useEffect } from 'react';
import { useCalendarBlockParams } from '../hooks/useCalendarBlockParams';

export const CalendarBlockContext = createContext<any>({});
CalendarBlockContext.displayName = 'CalendarBlockContext';

const InternalCalendarBlockProvider = (props) => {
  const { fieldNames, showLunar, defaultView, enableQuickCreateEvent, weekStart } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();

  return (
    <CalendarBlockContext.Provider
      value={{
        field,
        service,
        resource,
        fieldNames,
        showLunar,
        defaultView,
        enableQuickCreateEvent: enableQuickCreateEvent ?? true,
        fixedBlock: field?.decoratorProps?.fixedBlock,
        weekStart,
      }}
    >
      {props.children}
    </CalendarBlockContext.Provider>
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
      <div key={props.fieldNames.colorFieldName}>
        <BlockProvider name="calendar" {...props} params={params}>
          <InternalCalendarBlockProvider {...props} />
        </BlockProvider>
      </div>
    );
  },
  { displayName: 'CalendarBlockProvider' },
);

export const useCalendarBlockContext = () => {
  return useContext(CalendarBlockContext);
};

const useDefaultGetColor = () => {
  return {
    getFontColor(value) {
      return null;
    },
    getBackgroundColor(value) {
      return null;
    },
  };
};

export const useCalendarBlockProps = () => {
  const ctx = useCalendarBlockContext();
  const field = useField<ArrayField>();
  const app = useApp();
  const plugin = app.pm.get('calendar') as any;
  const collection = useCollection();
  const colorCollectionField = collection.getField(ctx.fieldNames.colorFieldName);
  const pluginColorField = plugin.getColorFieldInterface(colorCollectionField?.interface) || {};
  const useGetColor = pluginColorField.useGetColor || useDefaultGetColor;
  const { getFontColor, getBackgroundColor } = useGetColor(colorCollectionField) || {};

  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.componentProps.dataSource = ctx?.service?.data?.data;
    }
  }, [ctx?.service?.loading]);

  return {
    fieldNames: ctx.fieldNames,
    showLunar: ctx.showLunar,
    defaultView: ctx.defaultView,
    enableQuickCreateEvent: ctx.enableQuickCreateEvent,
    fixedBlock: ctx.fixedBlock,
    getFontColor,
    getBackgroundColor,
    weekStart: ctx.weekStart,
  };
};
