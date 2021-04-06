import React from 'react';
import { Helmet, useModel, Link } from 'umi';
import get from 'lodash/get';
import { Login } from '@/components/views/Login';

export default (props: any) => {
  const { initialState = {}, refresh, setInitialState } = useModel(
    '@@initialState',
  );
  const siteTitle = get(initialState, 'systemSettings.title');
  return (
    <div>
      <Helmet>
        <title>{siteTitle ? `登录 - ${siteTitle}` : '登录'}</title>
      </Helmet>
      <Login {...props} />
    </div>
  );
};
