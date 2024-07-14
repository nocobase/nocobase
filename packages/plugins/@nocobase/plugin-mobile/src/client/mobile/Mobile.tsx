/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OpenModeProvider, usePlugin } from '@nocobase/client';
import React from 'react';
import { isDesktop } from 'react-device-detect';

import { PageBackgroundColor } from '../constants';
import { DesktopMode } from '../desktop-mode/DesktopMode';
import { PluginMobileClient } from '../index';
import { MobileActionPage } from '../pages/mobile-action-page/MobileActionPage';
import { MobileAppProvider } from './MobileAppContext';

export const Mobile = () => {
  const mobilePlugin = usePlugin(PluginMobileClient);
  const MobileRouter = mobilePlugin.getRouterComponent();

  // 设置的移动端 meta
  React.useEffect(() => {
    if (!isDesktop) {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      viewportMeta.setAttribute('content', 'width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no');

      document.body.style.backgroundColor = PageBackgroundColor;

      // 触发视图重绘
      const fakeBody = document.createElement('div');
      document.body.appendChild(fakeBody);
      document.body.removeChild(fakeBody);
    }
  }, []);

  const DesktopComponent = mobilePlugin.desktopMode === false ? React.Fragment : DesktopMode;

  return (
    <DesktopComponent>
      <OpenModeProvider
        defaultOpenMode="page"
        hideOpenMode
        openModeToComponent={{
          page: MobileActionPage,
          drawer: MobileActionPage,
        }}
      >
        <MobileAppProvider>
          <MobileRouter />
        </MobileAppProvider>
      </OpenModeProvider>
    </DesktopComponent>
  );
};
