import { Menu } from 'antd';
import React from 'react';
import { MoreOutlined, DesktopOutlined } from '@ant-design/icons';
import { ProfileAction } from './ProfileAction';

export const CurrentUser = () => null;

CurrentUser.Dropdown = () => {
  return (
    // @ts-ignore
    <Menu.SubMenu eventKey={'CurrentUser.Dropdown'} title={'超级管理员'}>
      <ProfileAction />
      <Menu.Item>切换角色</Menu.Item>
      <Menu.Item>语言设置</Menu.Item>
      <Menu.Divider />
      <Menu.Item>注销</Menu.Item>
    </Menu.SubMenu>
  );
};
