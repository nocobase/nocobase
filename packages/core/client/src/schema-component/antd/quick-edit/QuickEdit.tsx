import { EditOutlined } from '@ant-design/icons';
import { FormItem } from '@formily/antd';
import { createForm } from '@formily/core';
import { FormContext, RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import { Popover } from 'antd';
import React, { useMemo } from 'react';
import { useCollectionManager } from '../../../collection-manager';

export const QuickEdit = observer((props) => {
  const field: any = useField();
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const collectionField = getCollectionJoinField(fieldSchema['x-collection-field']);
  if (!collectionField) {
    return null;
  }
  const schema: any = {
    name: fieldSchema.name,
    'x-collection-field': fieldSchema['x-collection-field'],
    'x-component': 'CollectionField',
    'x-read-pretty': true,
    default: field.value,
    'x-component-props': fieldSchema['x-component-props'],
  };
  const form = useMemo(
    () =>
      createForm({
        values: {
          [fieldSchema.name]: field.value,
        },
      }),
    [field.value, fieldSchema['x-component-props']],
  );
  return (
    <FormItem labelStyle={{ display: 'none' }}>
      <Popover
        zIndex={1001}
        content={<div style={{ width: '100%', height: '100%', minWidth: 300 }}>{props.children}</div>}
        trigger="click"
      >
        <span style={{ maxHeight: 30, display: 'block', cursor: 'pointer' }}>
          <EditOutlined
            style={{ marginRight: '8px', lineHeight: '35px', float: 'left', color: !field.valid ? 'red' : null }}
          />
        </span>
        <FormContext.Provider value={form}>
          <RecursionField schema={schema} name={fieldSchema.name} />
        </FormContext.Provider>
      </Popover>
    </FormItem>
  );
});
