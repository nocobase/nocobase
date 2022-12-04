import React from 'react';
import { connect, useFieldSchema, useForm } from '@formily/react';
import { Space, useCompile, useRecord } from '@nocobase/client';

export const SnapshotField = connect((props) => {
  const fieldSchema = useFieldSchema();
  const record = useRecord();
  const compile = useCompile();

  const [snapshotKey, snapshotFieldKey] = (fieldSchema.name as string).split('.') ?? [];

  const values = record[snapshotKey]?.map((i) => i[snapshotFieldKey]);

  console.log(useForm());

  return (
    <Space>
      {values?.map((i) => (
        <span>{compile(i)}</span>
      ))}
    </Space>
  );
});

export default SnapshotField;
