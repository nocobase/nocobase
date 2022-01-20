import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer, SchemaContext, useField, useFieldSchema } from '@formily/react';
import { TableProps } from 'antd';
import React, { useMemo } from 'react';
import { useAttach } from '../../hooks';
import { ArrayTable } from '../array-table';

type VoidTableType = React.FC<TableProps<any>> & {
  Column?: React.FC<any>;
  mixin?: (T: any) => void;
};

export const VoidTable: VoidTableType = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          [fieldSchema.name]: props.dataSource || [],
        },
      }),
    [],
  );
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  return (
    <div>
      <FormContext.Provider value={form}>
        <SchemaContext.Provider value={fieldSchema}>
          <FieldContext.Provider value={f}>
            <ArrayTable {...props} />
          </FieldContext.Provider>
        </SchemaContext.Provider>
      </FormContext.Provider>
    </div>
  );
});

VoidTable.mixin = ArrayTable.mixin;

ArrayTable.mixin(VoidTable)
