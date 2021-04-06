import React from 'react';
import { Helmet, useModel } from 'umi';
import get from 'lodash/get';
import { ResetPassword } from '@/components/views/ResetPassword';

export default (props: any) => {
  const { initialState = {}, refresh, setInitialState } = useModel(
    '@@initialState',
  );
  const siteTitle = get(initialState, 'systemSettings.title');
  return (
    <div>
      <Helmet>
        <title>{siteTitle ? `重置密码 - ${siteTitle}` : '重置密码'}</title>
      </Helmet>
      <ResetPassword {...props} />
    </div>
  );
};
