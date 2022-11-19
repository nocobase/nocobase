import { observer } from '@formily/react';
import { Tag } from 'antd';
import React from 'react';
import { useCompile } from '../../../schema-component';
import { useCollectionManager } from '../../hooks';

export const CollectionFieldInterface = observer((props: any) => {
  const { value } = props;
  const { getInterface } = useCollectionManager();
  const compile = useCompile();
  const schema = getInterface(value);

  if (!schema) return null;

  return <Tag>{compile(schema.title)}</Tag>;
});
