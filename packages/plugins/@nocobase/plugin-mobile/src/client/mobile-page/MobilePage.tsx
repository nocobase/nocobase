/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { MobilePageContextProps, MobilePageProvider } from './context';

export interface MobilePageProps extends MobilePageContextProps {
  children?: React.ReactNode;
}

export const MobilePage: FC<MobilePageProps> = ({ children, ...props }) => {
  // <div style={{ minHeight: '100vh', maxWidth: '100%', overflowX: 'hidden' }}>
  return (
    <div style={{ paddingBottom: 20 }}>
      <MobilePageProvider {...props}>{children}</MobilePageProvider>
    </div>
  );
};
