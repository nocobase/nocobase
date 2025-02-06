/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Layout } from 'antd';
import React, { FC } from 'react';
import { isDesktop } from 'react-device-detect';

import { useUIConfigurationPermissions } from '@nocobase/client';
import { PageBackgroundColor } from '../constants';
import { DesktopModeContent } from './Content';
import { DesktopModeHeader } from './Header';
import { SizeContextProvider } from './sizeContext';

interface DesktopModeProps {
  children?: React.ReactNode;
}

export const DesktopMode: FC<DesktopModeProps> = ({ children }) => {
  const { allowConfigUI } = useUIConfigurationPermissions();

  if (!isDesktop || !allowConfigUI) {
    return <>{children}</>;
  }

  return (
    <SizeContextProvider>
      <Layout style={{ height: '100%', background: PageBackgroundColor }}>
        <Layout.Header style={{ height: 46 }}>
          <DesktopModeHeader />
        </Layout.Header>
        <Layout.Content>
          <DesktopModeContent>{children}</DesktopModeContent>
        </Layout.Content>
      </Layout>
    </SizeContextProvider>
  );
};
