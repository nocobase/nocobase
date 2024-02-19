import { observer } from '@formily/react';
import { Tag } from 'antd';
import React from 'react';
import { useCompile, useCollectionManager } from '@nocobase/client';

export const CollectionTemplateTag = observer(
  (props: any) => {
    const { value } = props;
    const { getTemplate } = useCollectionManager();
    const compile = useCompile();
    const schema = getTemplate(value);

    return <Tag>{compile(schema?.title || '{{t("General collection")}}')}</Tag>;
  },
  { displayName: 'CollectionTemplateTag' },
);
