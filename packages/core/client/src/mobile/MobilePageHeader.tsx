/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SafeArea } from 'antd-mobile';
import React, { FC } from 'react';

import { useMobilePage } from './MobilePageContext';

export const mobilePageHeaderStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 100,
  backgroundColor: '#fff',
};

export const MobilePageHeader: FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { displayPageHeader = true } = useMobilePage() || {};

  if (!displayPageHeader) {
    return null;
  }

  return (
    <div className="mobile-page-header" data-testid="mobile-page-header" style={mobilePageHeaderStyle}>
      <SafeArea position="top" />
      {children}
    </div>
  );
};
