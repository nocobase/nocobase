import { observer } from '@formily/react';
import { Tag } from 'antd';
import React, { useMemo } from 'react';
import { useCompile } from '../../../schema-component';
import { useCollectionManagerV2 } from '../../../application';

export const CollectionTemplate = observer(
  (props: any) => {
    const { value } = props;
    const collectionManager = useCollectionManagerV2();
    const compile = useCompile();
    const collectionTemplate = useMemo(
      () => collectionManager.getCollectionTemplate(value),
      [collectionManager, value],
    );

    return <Tag>{compile(collectionTemplate?.title || '{{t("General collection")}}')}</Tag>;
  },
  { displayName: 'CollectionTemplate' },
);
