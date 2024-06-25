/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Layout } from 'antd';
import { isDesktop } from 'react-device-detect';

import { DesktopModeHeader } from './Header';
import { DesktopModeContent } from './Content';
import { SizeContextProvider } from './sizeContext';

interface DesktopModeProps {
  children?: React.ReactNode;
}

export const DesktopMode: FC<DesktopModeProps> = ({ children }) => {
  if (!isDesktop) {
    return <>{children}</>;
  }
  return (
    <SizeContextProvider>
      <Layout style={{ height: '100%' }}>
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
