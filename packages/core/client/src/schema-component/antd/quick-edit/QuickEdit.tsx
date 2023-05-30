import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { useField, observer } from '@formily/react';
import { FormItem } from '@formily/antd';
import CollectionField from '../../../collection-manager/CollectionField';

export const QuickEdit = observer((props) => {
  const field: any = useField();
  const content = (
    <div>
      <CollectionField
        value={field.value}
        onChange={(e) => {
          const data = e.target?.value || e;
          field.value = data;
        }}
      />
    </div>
  );

  return (
    <FormItem {...props}>
      <Popover content={content} trigger="click">
        <EditOutlined />
        {/* <CollectionField value={field.value} /> */}
        {field.value}
      </Popover>
    </FormItem>
  );
});
