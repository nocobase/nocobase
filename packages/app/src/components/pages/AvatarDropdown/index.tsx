import React from 'react';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
import './style.less';
import { history, Link, request, useModel } from 'umi';
import {
  ProfileOutlined,
  LogoutOutlined,
  UserOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import Icon from '@/components/icons';
import { useResponsive } from 'ahooks';

const overlay = (
  <Menu>
    <Menu.Item disabled>
      <ProfileOutlined /> 个人资料
    </Menu.Item>
    <Menu.Divider></Menu.Divider>
    <Menu.Item
      onClick={async () => {
        await request('/users:logout');
        localStorage.removeItem('NOCOBASE_TOKEN');
        (window as any).routesReload();
        history.push('/login');
        // window.location.href = '/login';
      }}
    >
      <LogoutOutlined /> 退出登录
    </Menu.Item>
  </Menu>
);

export default (props: any) => {
  const {
    initialState = {},
    loading,
    error,
    refresh,
    setInitialState,
  } = useModel('@@initialState');
  const responsive = useResponsive();
  const isMobile = responsive.small && !responsive.middle && !responsive.large;
  return (
    <div className={'avatar-dropdown-wrapper'}>
      <Dropdown
        trigger={isMobile ? ['click'] : ['hover']}
        overlay={overlay}
        placement="bottomRight"
      >
        <span
          style={{ display: 'block' }}
          className="dropdown-link"
          onClick={e => e.preventDefault()}
        >
          <Avatar
            size={'small'}
            icon={<UserOutlined />}
            style={{ marginRight: 5 }}
          />{' '}
          { initialState.currentUser.nickname || initialState.currentUser.email }
        </span>
      </Dropdown>
    </div>
  );
};
