import { ArrayField, createForm } from '@formily/core';
import { FieldContext, FormContext, observer, SchemaContext, useField, useFieldSchema } from '@formily/react';
import { useRequest } from '../../../api-client';
import { TableProps } from 'antd';
import React, { createContext, useMemo } from 'react';
import { useAttach } from '../../hooks';
import { ArrayTable } from '../array-table';

type VoidTableType = React.FC<TableProps<any> & { request?: any }> & {
  Column?: React.FC<any>;
  mixin?: (T: any) => void;
};

interface ArrayFieldProviderProps {
  request?: any;
  initialValue?: any;
}

const RequestContext = createContext(null);

const ArrayFieldProvider: React.FC<ArrayFieldProviderProps> = (props) => {
  const { request, initialValue, children } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          [fieldSchema.name]: initialValue || [],
        },
      }),
    [],
  );
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  const result = useRequest(request, {
    onSuccess(data) {
      console.log(data?.data);
      form.setValues({
        [fieldSchema.name]: data?.data,
      });
    },
  });
  return (
    <RequestContext.Provider value={result}>
      <FormContext.Provider value={form}>
        <SchemaContext.Provider value={fieldSchema}>
          <FieldContext.Provider value={f}>{children}</FieldContext.Provider>
        </SchemaContext.Provider>
      </FormContext.Provider>
    </RequestContext.Provider>
  );
};

export const VoidTable: VoidTableType = observer((props) => {
  return (
    <ArrayFieldProvider request={props.request} initialValue={props.dataSource}>
      <RequestContext.Consumer>
        {(result) => {
          return <ArrayTable {...props} loading={result.loading} />;
        }}
      </RequestContext.Consumer>
    </ArrayFieldProvider>
  );
});

VoidTable.mixin = ArrayTable.mixin;

ArrayTable.mixin(VoidTable);
