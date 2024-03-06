import { UserOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { error } from '@nocobase/utils/client';
import { App, Dropdown, Menu, MenuProps } from 'antd';
import React, { createContext, useCallback, useMemo as useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useACLRoleContext, useAPIClient, useCurrentUserContext, useToken } from '..';
import { useChangePassword } from './ChangePassword';
import { useCurrentUserSettingsMenu } from './CurrentUserSettingsMenuProvider';
import { useEditProfile } from './EditProfile';
import { useLanguageSettings } from './LanguageSettings';
import { useSwitchRole } from './SwitchRole';

const useNickname = () => {
  const { data } = useCurrentUserContext();
  const { token } = useToken();

  return useEffect(() => {
    return {
      key: 'nickname',
      disabled: true,
      label: (
        <span aria-disabled="false" style={{ cursor: 'text', color: token.colorTextDescription }}>
          {data?.data?.nickname || data?.data?.username || data?.data?.email}
        </span>
      ),
    };
  }, [data?.data?.email, data?.data?.nickname, data?.data?.username, data?.data.version, token.colorTextDescription]);
};

/**
 * @note If you want to change here, Note the Setting block on the mobile side
 */
export const SettingsMenu: React.FC<{
  redirectUrl?: string;
}> = (props) => {
  const { addMenuItem, getMenuItems } = useCurrentUserSettingsMenu();
  const { redirectUrl = '' } = props;
  const { allowAll, snippets } = useACLRoleContext();
  const appAllowed = allowAll || snippets?.includes('app');
  const navigate = useNavigate();
  const api = useAPIClient();
  const { t } = useTranslation();
  const silenceApi = useAPIClient();
  const check = useCallback(async () => {
    return await new Promise((resolve) => {
      const heartbeat = setInterval(() => {
        silenceApi
          .silent()
          .resource('app')
          .getInfo()
          .then((res) => {
            if (res?.status === 200) {
              resolve('ok');
              clearInterval(heartbeat);
            }
            return res;
          })
          .catch((err) => {
            error(err);
          });
      }, 3000);
    });
  }, [silenceApi]);
  const nickname = useNickname();
  const editProfile = useEditProfile();
  const changePassword = useChangePassword();
  const switchRole = useSwitchRole();
  const languageSettings = useLanguageSettings();
  const { modal } = App.useApp();
  const controlApp = useEffect<MenuProps['items']>(() => {
    if (!appAllowed) {
      return [];
    }

    return [
      {
        key: 'cache',
        label: t('Clear cache'),
        onClick: async () => {
          await api.resource('app').clearCache();
          window.location.reload();
        },
      },
      {
        key: 'reboot',
        label: t('Restart application'),
        onClick: async () => {
          modal.confirm({
            title: t('Restart application'),
            // content: t('The will interrupt service, it may take a few seconds to restart. Are you sure to continue?'),
            okText: t('Restart'),
            okButtonProps: {
              danger: true,
            },
            onOk: async () => {
              await api.resource('app').restart();
            },
          });
        },
      },
      {
        key: 'divider_4',
        type: 'divider',
      },
    ];
  }, [api, appAllowed, check, modal, t]);

  useEffect(() => {
    const items = [
      nickname,
      {
        key: 'divider_1',
        type: 'divider',
      },
      editProfile,
      changePassword,
      {
        key: 'divider_2',
        type: 'divider',
      },
      switchRole,
      {
        key: 'divider_3',
        type: 'divider',
      },
      ...controlApp,
      {
        key: 'signout',
        label: t('Sign out'),
        onClick: async () => {
          await api.auth.signOut();
          navigate(`/signin?redirect=${encodeURIComponent(redirectUrl)}`);
        },
      },
    ];

    items.forEach((item) => {
      if (item) {
        addMenuItem(item);
      }
    });
    if (languageSettings) {
      addMenuItem(languageSettings, { before: 'divider_3' });
    }
  }, [
    addMenuItem,
    api.auth,
    changePassword,
    controlApp,
    editProfile,
    languageSettings,
    navigate,
    redirectUrl,
    switchRole,
    t,
    nickname,
  ]);

  return <Menu items={getMenuItems()} />;
};

export const DropdownVisibleContext = createContext(null);
DropdownVisibleContext.displayName = 'DropdownVisibleContext';

export const CurrentUser = () => {
  const [visible, setVisible] = useState(false);
  const { token } = useToken();

  return (
    <div
      className={css`
        display: inline-block;
        vertical-align: top;
        width: 46px;
        height: 46px;
        &:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
      `}
    >
      <DropdownVisibleContext.Provider value={{ visible, setVisible }}>
        <Dropdown
          open={visible}
          onOpenChange={(visible) => {
            setVisible(visible);
          }}
          dropdownRender={() => {
            return <SettingsMenu />;
          }}
        >
          <span
            data-testid="user-center-button"
            className={css`
              max-width: 160px;
              overflow: hidden;
              display: inline-block;
              line-height: 12px;
              white-space: nowrap;
              text-overflow: ellipsis;
            `}
            style={{ cursor: 'pointer', padding: '16px', color: token.colorTextHeaderMenu }}
          >
            <UserOutlined />
          </span>
        </Dropdown>
      </DropdownVisibleContext.Provider>
    </div>
  );
};
