import React from 'react';
import { Table } from 'antd';
import { observer, useField, useFieldSchema } from '@formily/react';
import { ArrayField } from '@formily/core';

export const ArrayTable = observer((props) => {
  const fieldSchema = useFieldSchema();
  const field = useField<ArrayField>();
  return (
    <div>
      <Table {...props} dataSource={field.value} />
    </div>
  );
});
