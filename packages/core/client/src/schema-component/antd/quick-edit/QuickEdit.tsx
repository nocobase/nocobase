import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { useField, observer, useFieldSchema, RecursionField, useForm } from '@formily/react';
import { FormItem, FormLayout } from '@formily/antd';
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
    required: true,
    default: field.value,
    'x-component-props': {
      onChange: async (e) => {
        const data = e.target?.value;
        if (['hasMany', 'belongsToMany'].includes(collectionField.type)) {
          const result = field.value || [];
          result.push(data);
          field.value = result;
        } else {
          if (['circle', 'point', 'richText', 'polygon', 'lineString'].includes(collectionField.interface)) {
            field.value = e;
          } else {
            field.value = data;
          }
        }
        field.onInput(field.value);
      },
    },
  };
  const content = (
    <div style={{ width: '100%', height: '100%', minWidth: 300 }}>
      <FormProvider>
        <FormLayout feedbackLayout="popover">
          <RecursionField schema={schema} name={fieldSchema.name} />
        </FormLayout>
      </FormProvider>
    </div>
  );
  return (
    <Popover content={content} trigger="click">
      <span style={{ maxHeight: 30, display: 'block', cursor: 'pointer' }}>
        <FormItem {...props}>
          <EditOutlined style={{ marginRight: '8px', lineHeight: '35px', float: 'left' }} />
          <CollectionField value={field.value} name={fieldSchema.name} readPretty />
        </FormItem>
      </span>
    </Popover>
  );
});
