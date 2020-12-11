import React from 'react';
import { Layout, Dropdown, Avatar } from 'antd';
import './style.less';
import { history, Link, request, useModel } from 'umi';
import { UserOutlined, CodeOutlined } from '@ant-design/icons';
import AvatarDropdown from '../AvatarDropdown';
import Menu from '@/components/menu';

export function TopMenuLayout(props: any) {
  const { menu = [] } = props.page;
  return (
    <Layout style={{ height: '100vh' }}>
      <Layout.Header style={{height: 48, lineHeight: '48px', padding: 0}} className="nb-header">
        <div className="logo" style={{width: 200, height: 20, float: 'left'}}><CodeOutlined /> NocoBase</div>
        <Menu items={menu} className={'noco-top-menu'} style={{float: 'left'}} theme="dark" mode="horizontal">
        </Menu>
        <AvatarDropdown/>
      </Layout.Header>
      <Layout.Content>
        {props.children}
      </Layout.Content>
    </Layout>
  );
};

export default TopMenuLayout;
