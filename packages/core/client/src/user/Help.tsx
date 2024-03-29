import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Dropdown, Menu, Popover } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownVisibleContext, usePlugin, useToken } from '..';
import { useCurrentAppInfo } from '../appInfo/CurrentAppInfoProvider';
import { observer } from '@formily/reactive-react';
import { parseHTML } from '@nocobase/utils/client';

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

const helpClassName = css`
  display: inline-block;
  vertical-align: top;
  width: 46px;
  height: 46px;
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
  }
`;

export const Help = observer(
  () => {
    const [visible, setVisible] = useState(false);
    const { token } = useToken();
    const customBrandPlugin: any = usePlugin('@nocobase/plugin-custom-brand');
    const data = useCurrentAppInfo();

    const icon = (
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
    );

    if (customBrandPlugin?.options?.options?.about) {
      const appVersion = `<span class="nb-app-version">v${data?.data?.version}</span>`;
      const content = parseHTML(customBrandPlugin.options.options.about, { appVersion });

      return (
        <div className={helpClassName}>
          <Popover
            // nb-about 的样式定义在 plugin-custom-brand 插件中
            rootClassName="nb-about"
            placement="bottomRight"
            arrow={false}
            content={<div dangerouslySetInnerHTML={{ __html: content }}></div>}
          >
            {icon}
          </Popover>
        </div>
      );
    }

    return (
      <div className={helpClassName}>
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
            {icon}
          </Dropdown>
        </DropdownVisibleContext.Provider>
      </div>
    );
  },
  { displayName: 'Help' },
);
