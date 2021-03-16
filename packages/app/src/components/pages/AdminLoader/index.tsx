import React from 'react';
import api from '@/api-client';
import { useRequest, useLocation, useHistory, Redirect } from 'umi';
import get from 'lodash/get';
import { TopMenuLayout } from './TopMenuLayout';
import { SideMenuLayout } from './SideMenuLayout';
import Page from './Page';
import pathToRegexp from 'path-to-regexp'
import { Spin } from '@nocobase/client';

export function AdminLoader(props: any) {
  const { data = [], error, loading, run } = useRequest(() => api.resource('menus').getTree());
  (window as any).reloadMenu = async () => {
    await run();
  };
  const { lastPage: { path } } = props;
  const location = useLocation();
  const match = pathToRegexp(`${path}/:path?/:rowId?/:tabId?`).exec(location.pathname);
  const pageName = match[1]||null;
  const history = useHistory();
  
  const currentRowId = match[2]||null;
  const items = data
    // .filter(item => item.type !== 'group' || (item.children && item.children.length))
    ;
  const sideMenu = items.find(item => {
    if (item.paths && item.paths.includes(pageName)) {
      return true;
    }
    return false;
  });
  console.log({pageName, sideMenu})

  if (loading) {
    return <Spin/>
  }

  if (!pageName) {
    return <Redirect to={`/admin/${get(items, [0, 'path'])}`}/>;
  }

  return (
    <>
      <TopMenuLayout currentPageName={pageName} {...props} menu={items}>
        {sideMenu ? (
          <SideMenuLayout currentPageName={pageName} {...props} menuId={sideMenu.id} menu={sideMenu.children}>
            <Page currentRowId={currentRowId} pageName={pageName}></Page>
          </SideMenuLayout>
        ) : (
          <Page pageName={pageName}></Page>
        )}
      </TopMenuLayout>
    </>
  );
}

export default AdminLoader;
