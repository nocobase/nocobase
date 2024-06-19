/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token, css }) => ({
  mobileTabBarItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--adm-color-text-secondary)',
    whiteSpace: 'nowrap',
    padding: '4px 8px',
    flex: '1 1',
    width: 'min-content',
    position: 'relative',
    cursor: 'pointer',
  },
  mobileTabBarItemActive: {
    color: 'var(--adm-color-primary)',
  },
  mobileTabBarItemIcon: {
    fontSize: 24,
    height: 24,
    lineHeight: 1,
  },
  mobileTabBarItemTitle: {
    fontSize: 'var(--adm-font-size-2)',
    lineHeight: '15px',
    marginTop: 2,
  },
}));
