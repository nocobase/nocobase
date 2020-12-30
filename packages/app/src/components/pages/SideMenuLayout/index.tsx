import React, { useState } from 'react';
import { Layout, Breadcrumb } from 'antd';
import { Link } from 'umi';
import './style.less';
import Menu from '@/components/menu';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useLocalStorageState } from 'ahooks';

export function SideMenuLayout(props: any) {
  const { menu = [], id } = props.page;
  // console.log(menu);
  const [collapsed, setCollapsed] = useLocalStorageState(`nocobase-menu-collapsed-${id}`, false);
  return (
    <Layout style={{height: 'calc(100vh - 48px)'}}>
      <Layout.Sider className={`nb-sider${collapsed ? ' collapsed' : ''}`} theme={'light'}>
        <Menu items={menu} mode={'inline'}/>
        <div onClick={() => {
          setCollapsed(!collapsed);
        }} className={'menu-toggle'}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            style: { fontSize: 16 },
          })}
        </div>
      </Layout.Sider>
      <Layout.Content>
        {props.children}
      </Layout.Content>
    </Layout>
  );
};

export default SideMenuLayout;
