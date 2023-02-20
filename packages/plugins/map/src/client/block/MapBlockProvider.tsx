import { ArrayField } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { BlockProvider, useBlockRequestContext, useFixedSchema } from '@nocobase/client';
import React, { createContext, useContext, useEffect } from 'react';

export const MapBlockContext = createContext<any>({});

const InternalMapBlockProvider = (props) => {
  const { fieldNames } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  useFixedSchema();
  return (
    <MapBlockContext.Provider
      value={{
        field,
        service,
        resource,
        fieldNames,
        fixedBlock: fieldSchema?.['x-decorator-props']?.fixedBlock,
      }}
    >
      {props.children}
    </MapBlockContext.Provider>
  );
};

export const MapBlockProvider = (props) => {
  return (
    <BlockProvider {...props} params={{ ...props.params, paginate: false }}>
      <InternalMapBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useMapBlockContext = () => {
  return useContext(MapBlockContext);
};

export const useMapBlockProps = () => {
  const ctx = useMapBlockContext();
  const field = useField<ArrayField>();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.componentProps.dataSource = ctx?.service?.data?.data;
    }
  }, [ctx?.service?.loading]);

  return {
    fieldNames: ctx.fieldNames,
    fixedBlock: ctx.fixedBlock,
    zoom: ctx?.field?.componentProps?.zoom || 16,
  };
};
