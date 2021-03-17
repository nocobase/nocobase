import React from 'react';
import { Link } from 'umi';
import { Page } from '@/components/pages';
import ViewFactory from '@/components/views';
import { Helmet, useModel } from 'umi';
import get from 'lodash/get';

export default (props: any) => {
  const { initialState = {}, refresh, setInitialState } = useModel('@@initialState');
  const siteTitle = get(initialState, 'systemSettings.title');
  return (
    <div>
      <Helmet>
        <title>{siteTitle ? `登录 - ${siteTitle}` : '登录'}</title>
      </Helmet>
      <ViewFactory 
        {...props}
        viewName={'login'}
        resourceName={'users'}
      />
    </div>
  );
};