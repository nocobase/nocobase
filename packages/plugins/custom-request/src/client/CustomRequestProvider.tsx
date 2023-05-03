import { useField, useFieldSchema } from '@formily/react';
import { BlockProvider, FixedBlockWrapper, SchemaComponentOptions, useBlockRequestContext } from '@nocobase/client';
import React, { createContext, useContext, useState } from 'react';

export const CustomRequestContext = createContext<any>({});

const InternalCustomRequestProvider = (props) => {
  const { fieldNames } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  const [selectedRecordKeys, setSelectedRecordKeys] = useState([]);

  return (
    <FixedBlockWrapper>
      <SchemaComponentOptions scope={{ selectedRecordKeys }}>
        <CustomRequestContext.Provider
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
        </CustomRequestContext.Provider>
      </SchemaComponentOptions>
    </FixedBlockWrapper>
  );
};

export const CustomRequestProvider = (props) => {
  return (
    <BlockProvider {...props} params={{ ...props.params, paginate: false }}>
      <InternalCustomRequestProvider {...props} />
    </BlockProvider>
  );
};

export const useCustomRequestContext = () => {
  return useContext(CustomRequestContext);
};

export const useCustomRequestProps = () => {
  const ctx = useCustomRequestContext();

  return {
    ...ctx,
    dataSource: ctx?.service?.data?.data,
    zoom: ctx?.field?.componentProps?.zoom || 13,
  };
};
