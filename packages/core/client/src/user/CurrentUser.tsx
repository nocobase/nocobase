import { Dropdown, Menu } from 'antd';
import React, { createContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAPIClient, useCurrentUserContext } from '..';
import { useRequest } from '../api-client';
import { ChangePassword } from './ChangePassword';
import { EditProfile } from './EditProfile';
import { LanguageSettings } from './LanguageSettings';
import { SwitchRole } from './SwitchRole';

const ApplicationVersion = () => {
  const { data, loading } = useRequest({
    url: 'app:getInfo',
  });
  if (loading) {
    return null;
  }
  return (
    <Menu.Item key="version" disabled>
      Version {data?.data?.version}
    </Menu.Item>
  );
};

export const DropdownVisibleContext = createContext(null);

export const CurrentUser = () => {
  const history = useHistory();
  const api = useAPIClient();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { data } = useCurrentUserContext();
  return (
    <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
      <DropdownVisibleContext.Provider value={{ visible, setVisible }}>
        <Dropdown
          visible={visible}
          onVisibleChange={(visible) => {
            setVisible(visible);
          }}
          overlay={
            <Menu>
              <ApplicationVersion />
              <Menu.Divider />
              <EditProfile />
              <ChangePassword />
              <SwitchRole />
              <LanguageSettings />
              <Menu.Divider />
              <Menu.Item
                key="signout"
                onClick={async () => {
                  await api.resource('users').signout();
                  api.auth.setToken(null);
                  history.push('/signin');
                }}
              >
                {t('Sign out')}
              </Menu.Item>
            </Menu>
          }
        >
          <span style={{ cursor: 'pointer', border: 0, padding: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>
            {data?.data?.nickname || data?.data?.email}
          </span>
        </Dropdown>
      </DropdownVisibleContext.Provider>
    </div>
  );
};
