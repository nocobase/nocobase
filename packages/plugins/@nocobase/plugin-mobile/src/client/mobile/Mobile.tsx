/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AdminProvider,
  AllDataBlocksProvider,
  AntdAppProvider,
  AssociationFieldMode,
  AssociationFieldModeProvider,
  BlockTemplateProvider,
  GlobalThemeProvider,
  OpenModeProvider,
  useAssociationFieldModeContext,
  usePlugin,
  usePopupSettings,
  zIndexContext,
} from '@nocobase/client';
import React, { FC } from 'react';
import { isDesktop } from 'react-device-detect';

import { theme } from 'antd';
import { ActionDrawerUsedInMobile, useToAdaptActionDrawerToMobile } from '../adaptor-of-desktop/ActionDrawer';
import { useToAdaptFilterActionToMobile } from '../adaptor-of-desktop/FilterAction';
import { InternalPopoverNesterUsedInMobile } from '../adaptor-of-desktop/InternalPopoverNester';
import { useToAddMobilePopupBlockInitializers } from '../adaptor-of-desktop/mobile-action-page/blockInitializers';
import { MobileActionPage } from '../adaptor-of-desktop/mobile-action-page/MobileActionPage';
import { ResetSchemaOptionsProvider } from '../adaptor-of-desktop/ResetSchemaOptionsProvider';
import { PageBackgroundColor } from '../constants';
import { DesktopMode } from '../desktop-mode/DesktopMode';
import { PluginMobileClient } from '../index';
import { MobileAppProvider } from './MobileAppContext';
import { useStyles } from './styles';

const CommonDrawer: FC = (props) => {
  const { isPopupVisibleControlledByURL } = usePopupSettings();

  // 在移动端布局中，只要弹窗是通过 URL 打开的，都需要显示成子页面的样子。因为这样可以通过左滑返回
  if (isPopupVisibleControlledByURL()) {
    return <MobileActionPage {...(props as any)} />;
  }

  return <ActionDrawerUsedInMobile {...props} />;
};

const openModeToComponent = {
  page: CommonDrawer,
  drawer: ActionDrawerUsedInMobile,
  modal: ActionDrawerUsedInMobile,
};

export const Mobile = () => {
  useToAdaptFilterActionToMobile();
  useToAdaptActionDrawerToMobile();
  useToAddMobilePopupBlockInitializers();

  const { componentCls, hashId } = useStyles();
  const mobilePlugin = usePlugin(PluginMobileClient);
  const MobileRouter = mobilePlugin.getRouterComponent();
  const AdminProviderComponent = mobilePlugin?.options?.config?.skipLogin ? React.Fragment : AdminProvider;
  // 设置的移动端 meta
  React.useEffect(() => {
    if (!isDesktop) {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      viewportMeta.setAttribute(
        'content',
        'width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover',
      );

      document.body.style.backgroundColor = PageBackgroundColor;
      document.body.style.overflow = 'hidden';

      // 触发视图重绘
      const fakeBody = document.createElement('div');
      document.body.appendChild(fakeBody);
      document.body.removeChild(fakeBody);
    }
  }, []);

  const DesktopComponent = mobilePlugin.desktopMode === false ? React.Fragment : DesktopMode;
  const modeToComponent = React.useMemo(() => {
    return {
      PopoverNester: (props) => {
        const { getDefaultComponent } = useAssociationFieldModeContext();
        const OriginComponent = getDefaultComponent(AssociationFieldMode.PopoverNester);
        return <InternalPopoverNesterUsedInMobile {...props} OriginComponent={OriginComponent} />;
      },
    };
  }, []);

  return (
    <AdminProviderComponent>
      <DesktopComponent>
        {/* 目前移动端由于和客户端的主题对不上，所以先使用 `GlobalThemeProvider` 和 `AntdAppProvider` 进行重置为默认主题  */}
        <GlobalThemeProvider
          theme={{
            token: {
              paddingPageHorizontal: 8,
              paddingPageVertical: 8,
              marginBlock: 12,
              borderRadiusBlock: 8,
              fontSize: 14,
            },
            algorithm: theme.compactAlgorithm,
          }}
        >
          <AntdAppProvider className={`mobile-container ${componentCls} ${hashId}`}>
            <OpenModeProvider
              defaultOpenMode="page"
              isMobile={true}
              hideOpenMode
              openModeToComponent={openModeToComponent}
            >
              <BlockTemplateProvider componentNamePrefix="mobile-">
                <MobileAppProvider>
                  <ResetSchemaOptionsProvider>
                    <AssociationFieldModeProvider modeToComponent={modeToComponent}>
                      {/* the z-index of all popups and subpages will be based on this value */}
                      <zIndexContext.Provider value={100}>
                        <AllDataBlocksProvider>
                          <MobileRouter />
                        </AllDataBlocksProvider>
                      </zIndexContext.Provider>
                    </AssociationFieldModeProvider>
                  </ResetSchemaOptionsProvider>
                </MobileAppProvider>
              </BlockTemplateProvider>
            </OpenModeProvider>
          </AntdAppProvider>
        </GlobalThemeProvider>
      </DesktopComponent>
    </AdminProviderComponent>
  );
};
