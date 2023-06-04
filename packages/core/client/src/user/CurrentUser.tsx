import { css } from '@emotion/css';
import { Dropdown, Menu, Modal } from 'antd';
import React, { createContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useACLRoleContext, useAPIClient, useCurrentUserContext } from '..';
import { useCurrentAppInfo } from '../appInfo/CurrentAppInfoProvider';
import { ChangePassword } from './ChangePassword';
import { EditProfile } from './EditProfile';
import { LanguageSettings } from './LanguageSettings';
import { SwitchRole } from './SwitchRole';
import { ThemeSettings } from './ThemeSettings';

const ApplicationVersion = () => {
  const data = useCurrentAppInfo();
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
  const { allowAll, snippets } = useACLRoleContext();
  const appAllowed = allowAll || snippets?.includes('app');
  const silenceApi = useAPIClient();
  const check = async () => {
    return await new Promise((resolve) => {
      const heartbeat = setInterval(() => {
        silenceApi
          .silent()
          .resource('app')
          .getInfo()
          .then((res) => {
            console.log(res);
            if (res?.status === 200) {
              resolve('ok');
              clearInterval(heartbeat);
            }
            return res;
          })
          .catch(() => {
            // ignore
          });
      }, 3000);
    });
  };
  return (
    <div style={{ display: 'inline-flex', verticalAlign: 'top' }}>
      <DropdownVisibleContext.Provider value={{ visible, setVisible }}>
        <Dropdown
          open={visible}
          onOpenChange={(visible) => {
            setVisible(visible);
          }}
          overlay={
            <Menu>
              <ApplicationVersion />
              <Menu.Divider />
              <EditProfile />
              <ChangePassword />
              <Menu.Divider />
              <SwitchRole />
              <LanguageSettings />
              <ThemeSettings />
              <Menu.Divider />
              {appAllowed && (
                <>
                  <Menu.Item
                    key="cache"
                    onClick={async () => {
                      await api.resource('app').clearCache();
                      window.location.reload();
                    }}
                  >
                    {t('Clear cache')}
                  </Menu.Item>
                  <Menu.Item
                    key="reboot"
                    onClick={async () => {
                      Modal.confirm({
                        title: t('Reboot application'),
                        content: t(
                          'The will interrupt service, it may take a few seconds to restart. Are you sure to continue?',
                        ),
                        okText: t('Reboot'),
                        okButtonProps: {
                          danger: true,
                        },
                        onOk: async () => {
                          await api.resource('app').reboot();
                          await check();
                          window.location.reload();
                        },
                      });
                    }}
                  >
                    {t('Reboot application')}
                  </Menu.Item>
                  <Menu.Divider />
                </>
              )}
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
          <span
            className={css`
              max-width: 160px;
              overflow: hidden;
              display: inline-block;
              line-height: 12px;
              white-space: nowrap;
              text-overflow: ellipsis;
            `}
            style={{ cursor: 'pointer', border: 0, padding: '16px', color: 'rgba(255, 255, 255, 0.65)' }}
          >
            {data?.data?.nickname || data?.data?.email}
          </span>
        </Dropdown>
      </DropdownVisibleContext.Provider>
    </div>
  );
};
