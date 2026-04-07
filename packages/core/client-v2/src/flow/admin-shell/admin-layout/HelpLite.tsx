/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer, useFlowEngine } from '@nocobase/flow-engine';
import { parseHTML } from '@nocobase/utils/client';
import { Dropdown, Menu, Popover, theme as antdTheme } from 'antd';
import type { MenuItemType, MenuDividerType } from 'antd/es/menu/interface';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlugin } from '../../../flow-compat';
import type { CustomToken } from '../../../theme';

type SettingsMenuItemType = MenuItemType | MenuDividerType;

/**
 * 读取当前应用信息，避免继续依赖旧的 CurrentAppInfoProvider。
 */
function useCurrentAppInfoLite() {
  const flowEngine = useFlowEngine();
  const [data, setData] = useState<any>();

  useEffect(() => {
    let active = true;

    Promise.resolve(flowEngine.context.appInfo)
      .then((info) => {
        if (active) {
          setData(info);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, [flowEngine]);

  return data;
}

const helpClassName = css`
  display: inline-block;
  vertical-align: top;
  width: 46px;
  height: 46px;
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
  }
`;

const SettingsMenu: React.FC = () => {
  const { t } = useTranslation();
  const appInfo = useCurrentAppInfoLite();
  const { token } = antdTheme.useToken();
  const isSimplifiedChinese = appInfo?.lang === 'zh-CN';

  const items: SettingsMenuItemType[] = useMemo(
    () => [
      {
        key: 'nocobase',
        disabled: true,
        label: (
          <div style={{ cursor: 'text' }}>
            <div style={{ color: token.colorText }}>NocoBase</div>
            <div style={{ fontSize: '0.8em', color: token.colorTextDescription }}>v{appInfo?.version}</div>
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
          <a
            href={isSimplifiedChinese ? 'https://www.nocobase.com/cn/' : 'https://www.nocobase.com'}
            target="_blank"
            rel="noreferrer"
          >
            {t('Home page')}
          </a>
        ),
      },
      {
        key: 'userManual',
        label: (
          <a
            href={
              isSimplifiedChinese ? 'https://v2.docs.nocobase.com/cn/guide/' : 'https://v2.docs.nocobase.com/guide/'
            }
            target="_blank"
            rel="noreferrer"
          >
            {t('Handbook')}
          </a>
        ),
      },
      {
        key: 'license',
        label: (
          <a
            href={
              isSimplifiedChinese ? 'https://www.nocobase.com/cn/agreement' : 'https://www.nocobase.com/en/agreement'
            }
            target="_blank"
            rel="noreferrer"
          >
            {t('License')}
          </a>
        ),
      },
    ],
    [appInfo?.version, isSimplifiedChinese, t, token.colorText, token.colorTextDescription],
  );

  return <Menu items={items} />;
};

/**
 * flow 内的轻量帮助入口。
 */
export const HelpLite = observer(
  () => {
    const [visible, setVisible] = useState(false);
    const { token } = antdTheme.useToken();
    const customToken = token as CustomToken;
    const customBrandPlugin: any = usePlugin('@nocobase/plugin-custom-brand');
    const appInfo = useCurrentAppInfoLite();

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
        style={{ cursor: 'pointer', padding: '16px', color: customToken.colorTextHeaderMenu }}
      >
        <QuestionCircleOutlined />
      </span>
    );

    if (customBrandPlugin?.options?.options?.about) {
      const appVersion = `<span class="nb-app-version">v${appInfo?.version}</span>`;
      const content = parseHTML(customBrandPlugin.options.options.about, { appVersion });

      return (
        <div className={helpClassName}>
          <Popover
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
        <Dropdown
          open={visible}
          onOpenChange={(nextVisible) => {
            setVisible(nextVisible);
          }}
          dropdownRender={() => {
            return <SettingsMenu />;
          }}
        >
          {icon}
        </Dropdown>
      </div>
    );
  },
  { displayName: 'HelpLite' },
);
