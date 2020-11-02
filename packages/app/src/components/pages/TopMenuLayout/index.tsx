import React from 'react';
import { Layout, Menu } from 'antd';
import { Link } from 'umi';
import './style.less';

export function TopMenuLayout(props: any) {
  const { menu = [] } = props.page;
  return (
    <Layout style={{ height: '100vh' }}>
      <Layout.Header style={{height: 48, lineHeight: '48px', padding: 0}} className="nb-header">
        <div className="logo" style={{width: 200, height: 20, float: 'left'}}/>
        <Menu style={{float: 'left'}} theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
          {menu.map(item => (
            <Menu.Item key={item.path}>
              <Link to={item.path}>{item.title}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Layout.Header>
      <Layout.Content>
        {props.children}
      </Layout.Content>
    </Layout>
  );
};

export default TopMenuLayout;
