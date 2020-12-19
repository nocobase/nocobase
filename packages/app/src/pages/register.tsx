import React from 'react';
import { Link } from 'umi';
import { Page } from '@/components/pages';
import ViewFactory from '@/components/views';
import { Helmet } from 'umi';

export default (props: any) => {
  return (
    <div>
      <Helmet>
        <title>{'注册 NocoBase'}</title>
      </Helmet>
      <ViewFactory 
        {...props}
        viewName={'register'}
        resourceName={'users'}
      />
    </div>
  );
};