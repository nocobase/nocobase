import React from 'react';
import { Link } from 'umi';
import { Page } from '@/components/pages';
import ViewFactory from '@/components/views';
import { Helmet, useModel } from 'umi';
import get from 'lodash/get';
import { ResetPassword } from '@/components/views/Form/ResetPassword';

export default (props: any) => {
  const { initialState = {}, refresh, setInitialState } = useModel('@@initialState');
  const siteTitle = get(initialState, 'systemSettings.title');
  return (
    <div>
      <Helmet>
        <title>{siteTitle ? `重置密码 - ${siteTitle}` : '重置密码'}</title>
      </Helmet>
      <ResetPassword {...props}/>
    </div>
  );
};
