/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@nocobase/flow-engine';
import { Menu } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useSettingsGroups } from '../settings-center/useSettingsGroups';

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
 * 只铺分组（应用 / 数据 / 自动化 / 用户与权限 / 系统），
 * 分组内部的二三级菜单由左侧栏承担。
 */
export const SettingsGroupNav: React.FC = observer(() => {
  const { t } = useTranslation();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { groups, activeGroupKey, getGroupEntryPath } = useSettingsGroups();
  // 登录 / 找回密码等免鉴权页面共用同一个 shell，这些页面上不该出现设置导航。
  const isAuthRoute = app.router.isSkippedAuthCheckRoute(location.pathname);

  const items = useMemo(() => groups.map((group) => ({ key: group.key, label: t(group.title) })), [groups, t]);

  if (isAuthRoute || items.length <= 1) {
    return <div style={{ flex: 'auto' }} />;
  }

  return (
    <Menu
      mode="horizontal"
      disabledOverflow={false}
      selectedKeys={activeGroupKey ? [activeGroupKey] : []}
      items={items}
      style={navStyle}
      onClick={({ key }) => {
        const targetPath = getGroupEntryPath(key);
        if (targetPath && targetPath !== location.pathname) {
          navigate(targetPath);
        }
      }}
    />
  );
});

SettingsGroupNav.displayName = 'SettingsGroupNav';

export default SettingsGroupNav;
