import { useField, useFieldSchema } from '@formily/react';
import { BlockProvider, FixedBlockWrapper, SchemaComponentOptions, useBlockRequestContext } from '@nocobase/client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export const MapBlockContext = createContext<any>({});

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

  return {
    ...ctx,
    dataSource: ctx?.service?.data?.data,
    zoom: ctx?.field?.componentProps?.zoom || 13,
  };
};
