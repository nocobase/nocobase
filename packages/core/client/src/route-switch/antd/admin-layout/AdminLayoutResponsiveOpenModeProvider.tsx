/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ModalProps } from 'antd';
import React, { FC, useMemo } from 'react';
import { OpenModeProvider, useOpenModeContext } from '../../../modules/popup/OpenModeProvider';
import ActionDrawer from '../../../schema-component/antd/action/Action.Drawer';
import ActionModal from '../../../schema-component/antd/action/Action.Modal';
import ActionPage from '../../../schema-component/antd/action/Action.Page';
import { ActionDrawerProps } from '../../../schema-component/antd/action/types';
import { useCurrentPopupContext } from '../../../schema-component/antd/page/PagePopups';
import { usePopupSettings } from '../../../schema-component/antd/page/PopupSettingsProvider';

const useIsCurrentPopupControlledByURL = (level?: number) => {
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { params, currentLevel } = useCurrentPopupContext();

  return isPopupVisibleControlledByURL() && !!params?.popupuid && level === currentLevel;
};

const createResponsiveOpenModeComponent = <T,>(
  PopupComponent: FC<ActionDrawerProps<T>>,
  PageComponent: FC<ActionDrawerProps<T>>,
) => {
  const ResponsiveOpenModeComponent: FC<ActionDrawerProps<T>> = (props) => {
    const isCurrentPopupControlledByURL = useIsCurrentPopupControlledByURL(props.level);

    if (isCurrentPopupControlledByURL) {
      return <PageComponent {...props} />;
    }

    return <PopupComponent {...props} />;
  };

  return ResponsiveOpenModeComponent;
};

export const AdminLayoutResponsiveOpenModeProvider: FC<{
  responsive: boolean;
}> = (props) => {
  const parentOpenModeContext = useOpenModeContext();
  const responsiveOpenModeToComponent = useMemo(() => {
    const pageComponent = parentOpenModeContext?.getComponentByOpenMode('page') || ActionPage;
    const drawerComponent = parentOpenModeContext?.getComponentByOpenMode('drawer') || ActionDrawer;
    const modalComponent = parentOpenModeContext?.getComponentByOpenMode('modal') || ActionModal;

    return {
      page: pageComponent,
      drawer: createResponsiveOpenModeComponent(drawerComponent, pageComponent),
      modal: createResponsiveOpenModeComponent<ModalProps>(modalComponent, pageComponent),
    };
  }, [parentOpenModeContext]);

  if (!props.responsive) {
    return <>{props.children}</>;
  }

  return (
    <OpenModeProvider
      defaultOpenMode={parentOpenModeContext?.defaultOpenMode}
      hideOpenMode={parentOpenModeContext?.hideOpenMode}
      isMobile={parentOpenModeContext?.isMobile}
      openModeToComponent={responsiveOpenModeToComponent}
    >
      {props.children}
    </OpenModeProvider>
  );
};
