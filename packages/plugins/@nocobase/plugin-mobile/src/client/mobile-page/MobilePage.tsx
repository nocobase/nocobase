/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { MobilePageSettings } from './settings';

export interface MobilePageProps {
  children?: React.ReactNode;
}

export const MobilePage: FC<MobilePageProps> = ({ children }) => {
  return (
    <div style={{ position: 'relative' }}>
      <MobilePageSettings />
      {children}
    </div>
  );
};
