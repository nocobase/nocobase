import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import { Link } from 'umi';
import './style.less';

export function SideMenuLayout(props: any) {
  const { menu = [] } = props.page;
  console.log(menu);
  return (
    <Layout style={{height: 'calc(100vh - 48px)'}}>
      <Layout.Sider className={'nb-sider'} theme={'light'}>
        <Menu mode={'inline'}  defaultSelectedKeys={['2']}>
          {menu.map(item => (
            <Menu.Item key={item.path}>
              <Link to={item.path}>{item.title}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Layout.Sider>
      <Layout.Content>
        {props.children}
      </Layout.Content>
    </Layout>
  );
};

export default SideMenuLayout;
