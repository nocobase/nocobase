import React from 'react';
import { Link } from 'umi';
import { Page } from '@/components/pages';

export default (props: any) => {
  return (
    <Page title={'页面标题'}>
      Page2
      <Link to={'/page1'}>Page1</Link>
    </Page>
  );
};
