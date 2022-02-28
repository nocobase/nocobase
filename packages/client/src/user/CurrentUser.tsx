import { Button, Dropdown, Menu } from 'antd';
import React, { createContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAPIClient, useCurrentUserContext } from '..';
import { ChangePassword } from './ChangePassword';
import { EditProfile } from './EditProfile';
import { LanguageSettings } from './LanguageSettings';
import { SwitchRole } from './SwitchRole';

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
              <EditProfile />
              <ChangePassword />
              <SwitchRole />
              <LanguageSettings />
              <Menu.Divider />
              <Menu.Item
                onClick={() => {
                  api.setBearerToken(null);
                  history.push('/signin');
                }}
              >
                {t('Sign out')}
              </Menu.Item>
            </Menu>
          }
        >
          <Button ghost style={{ border: 0 }}>
            {data?.data?.nickname || data?.data?.email}
          </Button>
        </Dropdown>
      </DropdownVisibleContext.Provider>
    </div>
  );
};
