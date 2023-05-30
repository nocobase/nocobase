import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { useField, observer, useFieldSchema, FormProvider, useForm } from '@formily/react';
import { FormItem } from '@formily/antd';
import CollectionField from '../../../collection-manager/CollectionField';
import { useCollectionManager } from '../../../collection-manager';

export const QuickEdit = observer((props) => {
  const field: any = useField();
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const collectionField = getCollectionJoinField(fieldSchema['x-collection-field']);
  const content = (
    <div>
      <CollectionField
        readPretty={false}
        editable
        name={fieldSchema.name}
        value={field.value}
        onChange={(e) => {
          const data = e.target?.value || e;
          if (['hasMany', 'belongsToMany'].includes(collectionField.type)) {
            const result = field.value || [];
            result.push(data);
            field.value = result;
          } else {
            field.value = data;
          }
        }}
      />
    </div>
  );
  return (
    <FormItem {...props}>
      <Popover content={content} trigger="click">
        <EditOutlined />
        <CollectionField value={field.value} name={fieldSchema.name} readPretty />
      </Popover>
    </FormItem>
  );
});
