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
  navigationBarActionIcon: {
    width: 24,
    height: 24,
    lineHeight: '24px',
    fontSize: 24,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    '.schema-toolbar': {
      inset: '-15px -8px',
    },
  },
  navigationBarActionTitle: {
    fontSize: 17,
    padding: 0,
    '.schema-toolbar': {
      inset: '-15px -8px',
    },
  },
  navigationBarActionIconAndTitle: {
    height: '32px !important',
    fontSize: '17px !important',
    padding: '0 6px !important',
    '.schema-toolbar': {
      inset: '-15px',
    },
  },
}));
