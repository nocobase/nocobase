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
import { useACLCheckReady } from '../acl/aclCheckReadiness';
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
 * 应用、插件管理各自只有一个页面，直接当一级入口；其余全部收在「其他设置」下，
 * 鼠标移上去展开下拉——那一组没有左栏，下拉就是进入组内各页面的唯一入口。
 */
export const SettingsGroupNav: React.FC = observer(() => {
  const { t } = useTranslation();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = antdTheme.useToken();
  const { groups, activeGroupKey, currentTopLevelSetting, getGroupEntryPath } = useSettingsGroups();
  const isACLReady = useACLCheckReady(app);
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

  // 单入口分组直接当一级项，标题取配置项自己的名字（顺带继承插件的翻译）；
  // 系统设置这种大分组挂上子项，鼠标移上去展开。
  const items = useMemo(
    () =>
      groups.map((group) => {
        if (group.settings.length <= 1) {
          return {
            key: group.key,
            label: group.settings[0]?.label ?? t(group.title),
            icon: group.settings[0]?.icon,
          };
        }

        // 站在这个分组里时下拉照样弹：左栏已经去掉了，这里是进入组内其他页面的唯一入口。
        return {
          key: group.key,
          label: t(group.title),
          children: group.settings
            .filter((setting) => !setting.hidden)
            .map((setting) => ({
              key: `${group.key}::${setting.name}`,
              label: setting.label ?? setting.title,
              icon: setting.icon,
            })),
          // 分组标题只负责展开下拉，不可点：它不是一个页面，点它没有确定的落点。
          // 想进组内某一页，从下拉里挑。
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

  if (isAuthRoute || !isACLReady || items.length <= 1) {
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
