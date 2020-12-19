import React from 'react';
import { PageHeader } from 'antd';
import './style.less';
import { Helmet } from 'umi';

export function Page(props: any) {
  const { title, children, ...restProps } = props;
  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeader
        title={title}
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
