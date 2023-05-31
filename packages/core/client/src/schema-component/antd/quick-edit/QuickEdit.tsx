import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { useField, observer, useFieldSchema, RecursionField } from '@formily/react';
import { FormItem } from '@formily/antd';
import CollectionField from '../../../collection-manager/CollectionField';
import { useCollectionManager } from '../../../collection-manager';
import { FormProvider } from '../../core';

export const QuickEdit = observer((props) => {
  const field: any = useField();
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const collectionField = getCollectionJoinField(fieldSchema['x-collection-field']);
  const schema: any = {
    name: fieldSchema.name,
    'x-collection-field': fieldSchema['x-collection-field'],
    'x-component': 'CollectionField',
    default: field.value,
    'x-component-props': {
      onChange: (e) => {
        const data = e.target?.value || e;
        if (['hasMany', 'belongsToMany'].includes(collectionField.type)) {
          const result = field.value || [];
          result.push(data);
          field.value = result;
          field.onInput(field.value);
        } else {
          field.value = data;
        }
      },
    },
  };
  const content = (
    <div style={{ width: '100%', height: '100%', minWidth: 300 }}>
      <FormProvider>
        <RecursionField schema={schema} name={fieldSchema.name} />
      </FormProvider>
    </div>
  );
  return (
    <Popover content={content} trigger="click">
      <span style={{ display: 'flex', maxHeight: 30 }}>
        <EditOutlined style={{ marginRight: '10px', lineHeight: '25px' }} />
        <FormItem {...props}>
          <CollectionField value={field.value} name={fieldSchema.name} readPretty />
        </FormItem>
      </span>
    </Popover>
  );
});
