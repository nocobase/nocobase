import { Menu } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAPIClient, useDesignable } from '..';
import { ProfileAction } from './ProfileAction';

export const CurrentUser = () => {
  const history = useHistory();
  const { reset } = useDesignable();
  const api = useAPIClient();
  const { i18n } = useTranslation();
  return (
    <div style={{ display: 'inline-block' }}>
      <Menu selectable={false} mode={'horizontal'} theme={'dark'}>
        <Menu.SubMenu key={'current-user'} title={'超级管理员'}>
          <ProfileAction />
          <Menu.Item>切换角色</Menu.Item>
          <Menu.Item
            onClick={() => {
              i18n.changeLanguage(i18n.language === 'en-US' ? 'zh-CN' : 'en-US');
              // reset();
              window.location.reload();
            }}
          >
            语言设置
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            onClick={() => {
              api.setBearerToken(null);
              history.push('/signin');
            }}
          >
            注销
          </Menu.Item>
        </Menu.SubMenu>
      </Menu>
    </div>
  );
};
