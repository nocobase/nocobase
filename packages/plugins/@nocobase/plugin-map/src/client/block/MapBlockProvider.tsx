import { useField, useFieldSchema } from '@formily/react';
import { BlockProvider, FixedBlockWrapper, SchemaComponentOptions, useBlockRequestContext } from '@nocobase/client';
import React, { createContext, useContext, useState } from 'react';

export const MapBlockContext = createContext<any>({});
MapBlockContext.displayName = 'MapBlockContext';

const InternalMapBlockProvider = (props) => {
  const { fieldNames } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  const [selectedRecordKeys, setSelectedRecordKeys] = useState([]);

  return (
    <FixedBlockWrapper>
      <SchemaComponentOptions scope={{ selectedRecordKeys }}>
        <MapBlockContext.Provider
          value={{
            field,
            service,
            resource,
            fieldNames,
            fixedBlock: fieldSchema?.['x-decorator-props']?.fixedBlock,
            selectedRecordKeys,
            setSelectedRecordKeys,
          }}
        >
          {props.children}
        </MapBlockContext.Provider>
      </SchemaComponentOptions>
    </FixedBlockWrapper>
  );
};

export const MapBlockProvider = (props) => {
  const uField = useField();
  const { params, fieldNames } = props;
  const appends = params.appends || [];
  const { field } = fieldNames || {};
  if (Array.isArray(field) && field.length > 1) {
    appends.push(field[0]);
  }
  return (
    <BlockProvider
      name="map"
      {...props}
      runWhenParamsChanged
      params={{ ...params, appends, paginate: false, sort: uField.componentProps.lineSort }}
    >
      <InternalMapBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useMapBlockContext = () => {
  return useContext(MapBlockContext);
};

export const useMapBlockProps = () => {
  const ctx = useMapBlockContext();

  return {
    ...ctx,
    dataSource: ctx?.service?.data?.data,
    zoom: ctx?.field?.componentProps?.zoom || 13,
    lineSort: ctx?.field?.componentProps?.lineSort,
  };
};
