import { observer } from '@formily/react';
import { Tag } from 'antd';
import React from 'react';
import { useCompile } from '../../../schema-component';
import { useCollectionManager_deprecated } from '../../hooks';

export const CollectionFieldInterfaceTag = observer(
  (props: any) => {
    const { value } = props;
    const { getInterface } = useCollectionManager_deprecated();
    const compile = useCompile();
    const schema = getInterface(value);

    if (!schema) return null;

    return <Tag>{compile(schema.title)}</Tag>;
  },
  { displayName: 'CollectionFieldInterfaceTag' },
);
