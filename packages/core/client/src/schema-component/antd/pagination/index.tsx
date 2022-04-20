import { observer } from '@formily/react';
import { Pagination as AntdPagination } from 'antd';
import React from 'react';
import { useProps } from '../../hooks/useProps';

export const Pagination = observer((props: any) => {
  const { hidden, ...others } = useProps(props);
  if (hidden) {
    return null;
  }
  return <AntdPagination {...others} />;
});
