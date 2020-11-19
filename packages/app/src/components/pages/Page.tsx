import React from 'react';
import { PageHeader } from 'antd';
import './style.less';

export function Page(props: any) {
  const { children, ...restProps } = props;
  return (
    <div>
      <PageHeader
        ghost={false}
        {...restProps}
      />
      <div className={'page-content'}>
        {children}
      </div>
    </div>
  );
};

export default Page;
