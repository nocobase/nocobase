import React, { useContext, useEffect } from 'react';
import { Button, Dropdown, Menu } from 'antd';
import { useHistory } from 'react-router-dom';
import { request } from '../../schemas';

export const UserInfo = () => {
  const history = useHistory();
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item>个人资料</Menu.Item>
          <Menu.Divider />
          <Menu.Item
            onClick={async () => {
              await request('users:logout');
              localStorage.removeItem('NOCOBASE_TOKEN');
              history.push('/login');
            }}
          >
            退出登录
          </Menu.Item>
        </Menu>
      }
    >
      <Button type={'text'} className={'user-info'}>超级管理员</Button>
    </Dropdown>
  );
};
