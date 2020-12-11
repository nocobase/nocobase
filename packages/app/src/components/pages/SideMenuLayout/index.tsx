import React from 'react';
import { Layout, Breadcrumb } from 'antd';
import { Link } from 'umi';
import './style.less';
import Menu from '@/components/menu';

export function SideMenuLayout(props: any) {
  const { menu = [] } = props.page;
  console.log(menu);
  return (
    <Layout style={{height: 'calc(100vh - 48px)'}}>
      <Layout.Sider className={'nb-sider'} theme={'light'}>
        <Menu items={menu} mode={'inline'}/>
      </Layout.Sider>
      <Layout.Content>
        {props.children}
      </Layout.Content>
    </Layout>
  );
};

export default SideMenuLayout;
