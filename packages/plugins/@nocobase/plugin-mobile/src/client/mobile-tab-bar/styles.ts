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
  mobileTabBar: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderTop: '1px solid var(--adm-color-border)',
  },
  mobileTabBarList: {
    display: 'flex',
    background: '#fff',
    justifyContent: 'space-around',
    flex: 1,
    padding: '8px 0',
    alignItems: 'center',
    '.ant-btn-icon': {
      marginInlineEnd: '0 !important',
    },
  },
}));
