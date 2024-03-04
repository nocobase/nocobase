import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownVisibleContext, useToken } from '..';
import { useCurrentAppInfo } from '../appInfo/CurrentAppInfoProvider';

/**
 * @note If you want to change here, Note the Setting block on the mobile side
 */
const SettingsMenu: React.FC<{
  redirectUrl?: string;
}> = () => {
  const { t } = useTranslation();
  const data = useCurrentAppInfo();
  const { token } = useToken();

  // 是否是简体中文
  const isSimplifiedChinese = data?.data?.lang === 'zh-CN';

  const items = [
    {
      key: 'nocobase',
      disabled: true,
      label: (
        <div style={{ cursor: 'text' }}>
          <div style={{ color: token.colorText }}>NocoBase</div>
          <div style={{ fontSize: '0.8em', color: token.colorTextDescription }}>v{data?.data?.version}</div>
        </div>
      ),
    },
    {
      key: 'divider_1',
      type: 'divider',
    },
    {
      key: 'homePage',
      label: (
        <a href={isSimplifiedChinese ? 'https://cn.nocobase.com/' : 'https://www.nocobase.com'} target="__blank">
          {t('Home page')}
        </a>
      ),
    },
    {
      key: 'userManual',
      label: (
        <a
          href={isSimplifiedChinese ? 'https://docs-cn.nocobase.com/handbook' : 'https://docs.nocobase.com/handbook'}
          target="__blank"
        >
          {t('Handbook')}
        </a>
      ),
    },
    {
      key: 'license',
      label: (
        <a href="https://github.com/nocobase/nocobase/blob/main/LICENSE-AGPL" target="__blank">
          {t('License')}
        </a>
      ),
    },
  ];

  return <Menu items={items} />;
};

export const Help = () => {
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
            data-testid="help-button"
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
            <QuestionCircleOutlined />
          </span>
        </Dropdown>
      </DropdownVisibleContext.Provider>
    </div>
  );
};
