/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createStyles } from 'antd-style';

export const useStyles = createStyles(() => ({
  mobileNavigationBar: {
    position: 'sticky',
    top: 0,
    zIndex: 998,
    borderBottom: '1px solid var(--adm-color-border)',
    backgroundColor: 'var(--adm-color-background)',
    // '.adm-nav-bar-left': {
    //   flex: '0 0 auto',
    //   width: '40%',
    // },

    // '.adm-nav-bar-title': {
    //   padding: '0 6px',
    //   boxSizing: 'border-box',
    //   width: '20%',
    //   whiteSpace: 'nowrap',
    //   overflow: 'hidden',
    //   textOverflow: 'ellipsis',
    // },

    // '.adm-nav-bar-right': {
    //   flex: '0 0 auto',
    //   width: '40%',
    // },
  },
  mobileNavigationBarTabsWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileNavigationBarTabs: {
    '.adm-tabs-header': {
      borderBottomWidth: 0,
    },
  },
}));
