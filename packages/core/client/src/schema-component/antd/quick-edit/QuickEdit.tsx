import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { useField, observer, useFieldSchema } from '@formily/react';
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
  const ReadPrettyField = () => {
    if (field.value) {
      if (['hasMany', 'belongsToMany'].includes(collectionField.type)) {
        return field.value
          .map((v) => {
            return v[field.componentProps.fieldNames?.['label']];
          })
          .join(',');
      } else if (['hasOne', 'belongsTo'].includes(collectionField.type)) {
        field.value[field.componentProps.fieldNames?.['label']];
      }
      return field.value;
    }
    return field.value||'';
  };
  return (
    <FormItem {...props}>
      <Popover content={content} trigger="click">
        <EditOutlined />
        {/* <CollectionField value={field.value} /> */}
        <ReadPrettyField />
      </Popover>
    </FormItem>
  );
});
