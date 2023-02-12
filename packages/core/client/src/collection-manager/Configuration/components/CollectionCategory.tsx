import { observer } from '@formily/react';
import { Tag } from 'antd';
import React from 'react';
import { useCompile } from '../../../schema-component';

export const CollectionCategory = observer((props: any) => {
  const { value } = props;
  const compile = useCompile();
  return (
    <>
      {value.map((item) => {
        return <Tag color={item.color}>{compile(item?.name)}</Tag>;
      })}
    </>
  );
});
