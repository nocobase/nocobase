import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { Space, Typography } from 'antd';
import React from 'react';
import { useCollectionManager } from '../../../collection-manager/hooks';
import { useCompile } from '../../hooks';

export const FieldSummary = observer((props: any) => {
  const { schemaKey } = props;
  const { getInterface } = useCollectionManager();
  const compile = useCompile();
  const schema = getInterface(schemaKey);

  if (!schema) return (null);

  return (
    <div style={{marginBottom: '22px'}}>
      <Typography.Title level={3} style={{ margin: '0 0 10px 0' }}>{compile(schema.title)}</Typography.Title>
      { schema.description ? (<Typography.Text type="secondary">{compile(schema.description)}</Typography.Text>) : (null)}
    </div>
  )
});