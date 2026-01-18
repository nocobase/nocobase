/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AllDataBlocksProvider,
  AssociationFieldMode,
  AssociationFieldModeProvider,
  useAssociationFieldModeContext,
  usePopupSettings,
  zIndexContext,
} from '../schema-component';
import React, { FC } from 'react';
import { isDesktop } from 'react-device-detect';

import { theme } from 'antd';
import { ActionDrawerUsedInMobile, useToAdaptActionDrawerToMobile } from './adaptor-of-desktop/ActionDrawer';
import { useToAdaptFilterActionToMobile } from './adaptor-of-desktop/FilterAction';
import { InternalPopoverNesterUsedInMobile } from './adaptor-of-desktop/InternalPopoverNester';
import { useToAddMobilePopupBlockInitializers } from './adaptor-of-desktop/mobile-action-page/blockInitializers';
import { MobileActionPage } from './adaptor-of-desktop/mobile-action-page/MobileActionPage';
import { ResetSchemaOptionsProvider } from './adaptor-of-desktop/ResetSchemaOptionsProvider';
import { PageBackgroundColor } from './constants';
import { DesktopMode } from './desktop-mode/DesktopMode';
import { MobileAppProvider } from './MobileAppContext';
import { useStyles } from './styles';
import { useApp } from '../application';
import { AdminProvider } from '../route-switch';
import { AntdAppProvider, GlobalThemeProvider } from '../global-theme';
import { OpenModeProvider } from '../modules/popup/OpenModeProvider';
import { BlockTemplateProvider } from '../schema-templates';

const CommonDrawer: FC = (props) => {
  const { isPopupVisibleControlledByURL } = usePopupSettings();

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

  const app = useApp();
  const { componentCls, hashId } = useStyles();
  const mobilePlugin = app.pm.get('mobile') as any;
  const MobileRouter = mobilePlugin?.getRouterComponent();
  const AdminProviderComponent = mobilePlugin?.options?.config?.skipLogin ? React.Fragment : AdminProvider;

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

      const fakeBody = document.createElement('div');
      document.body.appendChild(fakeBody);
      document.body.removeChild(fakeBody);
    }
  }, []);

  const DesktopComponent = mobilePlugin?.desktopMode === false ? React.Fragment : DesktopMode;
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
