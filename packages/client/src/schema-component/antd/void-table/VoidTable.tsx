import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer, SchemaContext, useField, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { useAttach } from '../../hooks';
import { ArrayTable } from '../array-table';
import { TableProps } from 'antd';

export const VoidTable: React.FC<TableProps<any>> = observer((props) => {
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
