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
  mobilePageContent: {
    maxWidth: '100%',
    overflowX: 'hidden',
    '.ant-card': {
      marginBottom: '20px !important',
      borderRadius: '0 !important',
      boxShadow: 'none',
      borderBottom: '1px solid var(--adm-color-border)',
    },
    '.ant-nb-card-item': {
      marginBottom: '20px !important',
    },
  },
}));
