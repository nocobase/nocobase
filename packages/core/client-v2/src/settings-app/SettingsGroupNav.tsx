/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@nocobase/flow-engine';
import { ConfigProvider, Menu, theme as antdTheme } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useSettingsGroups } from '../settings-center/useSettingsGroups';
import { buildSettingsHeaderMenuTheme } from './settingsTheme';

const navStyle: React.CSSProperties = {
  background: 'transparent',
  borderBottom: 'none',
  flex: 'auto',
  minWidth: 0,
  lineHeight: '46px',
};

/**
 * 设置中心顶栏的一级导航。
 *
 * 应用、插件管理各自只有一个页面，直接当一级入口；其余全部收在「系统设置」下，
 * 鼠标移上去展开下拉，也可以点进去从左栏走。
 */
export const SettingsGroupNav: React.FC = observer(() => {
  const { t } = useTranslation();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = antdTheme.useToken();
  const { groups, activeGroupKey, currentTopLevelSetting, getGroupEntryPath } = useSettingsGroups();
  const headerMenuTheme = useMemo(() => buildSettingsHeaderMenuTheme(token), [token]);
  // 登录 / 找回密码等免鉴权页面共用同一个 shell，这些页面上不该出现设置导航。
  const isAuthRoute = app.router.isSkippedAuthCheckRoute(location.pathname);

  const handleClick = useCallback(
    ({ key }: { key: string }) => {
      const [groupKey, settingName] = key.split('::');
      const targetPath = settingName
        ? groups.find((group) => group.key === groupKey)?.settings.find((item) => item.name === settingName)?.path
        : getGroupEntryPath(groupKey);

      if (targetPath && targetPath !== location.pathname) {
        navigate(targetPath);
      }
    },
    [getGroupEntryPath, groups, location.pathname, navigate],
  );

  // 只有一个页面的分组直接当一级入口；系统设置这种大分组挂上子项，鼠标移上去即可展开全部设置。
  const items = useMemo(
    () =>
      groups.map((group) => {
        const label = t(group.title);
        if (group.settings.length <= 1) {
          return { key: group.key, label };
        }

        const children = group.settings
          .filter((setting) => !setting.hidden)
          .map((setting) => ({ key: `${group.key}::${setting.name}`, label: setting.label ?? setting.title }));
        const withDivider =
          group.leadCount > 0 && group.leadCount < children.length
            ? [...children.slice(0, group.leadCount), { type: 'divider' as const }, ...children.slice(group.leadCount)]
            : children;

        return {
          key: group.key,
          label,
          children: withDivider,
          // 点标题本身也要能进去，而不是只能从下拉里挑。
          onTitleClick: handleClick,
        };
      }),
    [groups, handleClick, t],
  );

  // 子菜单标题只有在它的某个子项被选中时才会高亮，所以两个 key 都要给。
  const selectedKeys = useMemo(() => {
    if (!activeGroupKey) {
      return [];
    }
    return currentTopLevelSetting?.name
      ? [activeGroupKey, `${activeGroupKey}::${currentTopLevelSetting.name}`]
      : [activeGroupKey];
  }, [activeGroupKey, currentTopLevelSetting?.name]);

  if (isAuthRoute || items.length <= 1) {
    return <div style={{ flex: 'auto' }} />;
  }

  return (
    <ConfigProvider theme={headerMenuTheme}>
      <Menu
        mode="horizontal"
        disabledOverflow={false}
        selectedKeys={selectedKeys}
        items={items}
        style={navStyle}
        triggerSubMenuAction="hover"
        onClick={handleClick}
      />
    </ConfigProvider>
  );
});

SettingsGroupNav.displayName = 'SettingsGroupNav';

export default SettingsGroupNav;
