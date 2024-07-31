/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Action,
  AntdAppProvider,
  BlockTemplateProvider,
  GlobalThemeProvider,
  OpenModeProvider,
  usePlugin,
} from '@nocobase/client';
import React from 'react';
import { isDesktop } from 'react-device-detect';

import { useToAdaptActionDrawerToMobile } from '../adaptor-of-desktop/ActionDrawer';
import { useToAdaptFilterActionToMobile } from '../adaptor-of-desktop/FilterAction';
import { ResetSchemaOptionsProvider } from '../adaptor-of-desktop/ResetSchemaOptionsProvider';
import { PageBackgroundColor } from '../constants';
import { DesktopMode } from '../desktop-mode/DesktopMode';
import { PluginMobileClient } from '../index';
import { MobileActionPage } from '../pages/mobile-action-page/MobileActionPage';
import { MobileAppProvider } from './MobileAppContext';

export const Mobile = () => {
  useToAdaptFilterActionToMobile();
  useToAdaptActionDrawerToMobile();

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
      document.body.style.overflow = 'hidden';

      // 触发视图重绘
      const fakeBody = document.createElement('div');
      document.body.appendChild(fakeBody);
      document.body.removeChild(fakeBody);
    }
  }, []);

  const DesktopComponent = mobilePlugin.desktopMode === false ? React.Fragment : DesktopMode;

  return (
    <DesktopComponent>
      {/* 目前移动端由于和客户端的主题对不上，所以先使用 `GlobalThemeProvider` 和 `AntdAppProvider` 进行重置为默认主题  */}
      <GlobalThemeProvider
        theme={{
          token: {
            marginBlock: 18,
            borderRadiusBlock: 0,
            boxShadowTertiary: 'none',
          },
        }}
      >
        <AntdAppProvider className="mobile-container" style={{ transform: 'translateZ(0)', overflow: 'hidden' }}>
          <OpenModeProvider
            defaultOpenMode="page"
            hideOpenMode
            openModeToComponent={{
              page: MobileActionPage,
              drawer: MobileActionPage,
              modal: Action.Modal,
            }}
          >
            <BlockTemplateProvider componentNamePrefix="mobile-">
              <MobileAppProvider>
                <ResetSchemaOptionsProvider>
                  <MobileRouter />
                </ResetSchemaOptionsProvider>
              </MobileAppProvider>
            </BlockTemplateProvider>
          </OpenModeProvider>
        </AntdAppProvider>
      </GlobalThemeProvider>
    </DesktopComponent>
  );
};
