import { observer } from '@formily/react';
import { Tag } from 'antd';
import React, { useMemo } from 'react';
import { useCompile } from '../../../schema-component';
import { useCollectionManagerV2 } from '../../../application';

export const CollectionFieldInterface = observer(
  (props: any) => {
    const { value } = props;
    const collectionManager = useCollectionManagerV2();
    const compile = useCompile();
    const collectionFieldInterface = useMemo(
      () => collectionManager.getCollectionFieldInterface(value),
      [collectionManager, value],
    );

    if (!collectionFieldInterface) return null;

    return <Tag>{compile(collectionFieldInterface.title)}</Tag>;
  },
  { displayName: 'CollectionFieldInterface' },
);
