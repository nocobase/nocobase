/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx } from '@nocobase/client';
import { SafeArea } from 'antd-mobile';
import React, { FC } from 'react';

import { useMobilePage } from '../context';
import { useStyles } from './styles';

export const MobilePageHeader: FC = ({ children }) => {
  const { displayPageHeader = true } = useMobilePage() || {};
  const { styles } = useStyles();
  if (!displayPageHeader) {
    return null;
  }

  return (
    <div className={cx(styles.mobilePageHeader, 'mobile-page-header')} data-testid="mobile-page-header">
      <SafeArea position="top" />
      {children}
    </div>
  );
};
