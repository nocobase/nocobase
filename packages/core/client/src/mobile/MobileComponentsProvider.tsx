/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Action, SchemaComponentOptions, usePopupSettings } from '../schema-component';
import { createGlobalStyle } from 'antd-style';
import React, { FC, useEffect } from 'react';
import { ActionDrawerUsedInMobile, useToAdaptActionDrawerToMobile } from './adaptor-of-desktop/ActionDrawer';
import { useToAdaptFilterActionToMobile } from './adaptor-of-desktop/FilterAction';
import { mobileComponents } from './pages/dynamic-page/MobilePage';
import { useMobileLayout } from '../route-switch';
import { OpenModeProvider } from '../modules/popup/OpenModeProvider';

const ResetScrollbar = createGlobalStyle`
  ::-webkit-scrollbar {
    display: none;
  }
`;

const CommonDrawer: FC = (props) => {
  const { isMobileLayout } = useMobileLayout();
  const { isPopupVisibleControlledByURL } = usePopupSettings();

  if (isMobileLayout && isPopupVisibleControlledByURL()) {
    return <Action.Page {...props} />;
  }

  return <ActionDrawerUsedInMobile {...props} />;
};

const openModeToComponent = {
  page: Action.Page,
  drawer: CommonDrawer,
  modal: CommonDrawer,
};

const MobileAdapter: FC = (props) => {
  useToAdaptFilterActionToMobile();
  useToAdaptActionDrawerToMobile();

  useEffect(() => {
    document.body.style.setProperty('--nb-mobile-page-tabs-content-padding', '12px');
    document.body.style.setProperty('--nb-mobile-page-header-height', '46px');
  }, []);

  return (
    <>
      <ResetScrollbar />
      <OpenModeProvider defaultOpenMode="page" isMobile={true} openModeToComponent={openModeToComponent}>
        <SchemaComponentOptions components={mobileComponents}>{props.children}</SchemaComponentOptions>
      </OpenModeProvider>
    </>
  );
};

export const MobileComponentsProvider: FC = (props) => {
  const { isMobileLayout } = useMobileLayout();

  if (!isMobileLayout) {
    return <>{props.children} </>;
  }

  return <MobileAdapter>{props.children}</MobileAdapter>;
};
