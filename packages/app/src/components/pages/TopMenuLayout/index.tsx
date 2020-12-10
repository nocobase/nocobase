import React from 'react';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
import './style.less';
import { history, Link, request, useModel } from 'umi';
import { UserOutlined } from '@ant-design/icons';
import Icon from '@/components/icons';

const overlay = (
  <Menu>
    <Menu.Item disabled>个人资料</Menu.Item>
    <Menu.Divider></Menu.Divider>
    <Menu.Item onClick={async () => {
      await request('/users:logout');
      localStorage.removeItem('NOCOBASE_TOKEN');
      (window as any).routesReload();
      history.push('/login');;
      // window.location.href = '/login';
    }}>退出登录</Menu.Item>
  </Menu>
);

export function TopMenuLayout(props: any) {
  const { menu = [] } = props.page;
  const { initialState = {}, loading, error, refresh, setInitialState } = useModel('@@initialState');
  return (
    <Layout style={{ height: '100vh' }}>
      <Layout.Header style={{height: 48, lineHeight: '48px', padding: 0}} className="nb-header">
        <div className="logo" style={{width: 200, height: 20, float: 'left'}}/>
        <Menu style={{float: 'left'}} theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
          {menu.map(item => (
            <Menu.Item key={item.path}>
              <Link to={item.path}><Icon type={item.icon}/>{item.title}</Link>
            </Menu.Item>
          ))}
        </Menu>
        <div className={'noco-user'} style={{position: 'absolute', right: 24, color: 'rgba(255, 255, 255, 0.65)'}}>
          <Dropdown overlay={overlay} placement="bottomRight">
            <span className="nbui-dropdown-link" onClick={e => e.preventDefault()}>
              <Avatar size={'small'} icon={<UserOutlined/>} style={{marginRight: 5}}/> {initialState.currentUser.nickname}
            </span>
          </Dropdown>
        </div>
      </Layout.Header>
      <Layout.Content>
        {props.children}
      </Layout.Content>
    </Layout>
  );
};

export default TopMenuLayout;
