import React from 'react';
import api from '@/api-client';
import { useRequest, useLocation } from 'umi';
import get from 'lodash';
import { TopMenuLayout } from './TopMenuLayout';
import { SideMenuLayout } from './SideMenuLayout';
import Page from './Page';
import pathToRegexp from 'path-to-regexp'
import { Spin } from '@nocobase/client';

export function AdminLoader(props: any) {
  const { data = [], error, loading, run } = useRequest(() => api.resource('menus').getTree());
  const { lastPage: { path } } = props;
  const location = useLocation();
  const match = pathToRegexp(`${path}/:path?`).exec(location.pathname);
  const pageName = match[1]||null;
  const items = data.filter(item => item.children && item.children.length);
  const sideMenu = items.find(item => {
    if (item.paths && item.paths.includes(location.pathname)) {
      return true;
    }
    return false;
  });

  if (loading) {
    return <Spin/>
  }

  return (
    <>
      <TopMenuLayout {...props} menu={items}>
        {sideMenu ? (
          <SideMenuLayout {...props} id={sideMenu.id} menu={sideMenu.children}>
            <Page pageName={pageName}></Page>
          </SideMenuLayout>
        ) : (
          <Page pageName={pageName}></Page>
        )}
      </TopMenuLayout>
    </>
  );
}

export default AdminLoader;
