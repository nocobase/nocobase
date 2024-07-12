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
  mobilePageTabs: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobilePageTabsList: {
    '.adm-tabs-header': {
      borderBottomWidth: 0,
    },

    '.adm-tabs-tab': {
      height: 49,
      padding: '10px 0 10px',
    },

    '.adm-tabs-tab-wrapper': {
      overflow: 'hidden',
    },
  },
}));
