import React from 'react';
import { Link } from 'umi';
import { Page } from '@/components/pages';
import ViewFactory from '@/components/views';

export default (props: any) => {
  return (
    <div>
      <ViewFactory 
        {...props}
        viewName={'login'}
        resourceName={'users'}
      />
    </div>
  );
};