/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePlugin } from '@nocobase/client';
import React, { FC, createContext } from 'react';
import { css } from '@emotion/css';
import { PluginMobileClient } from '../index';

interface MobileAppContextProps {
  showTabBar?: boolean;
  setShowTabBar?: (showTabBar: boolean) => void;
  showBackButton?: boolean;
  setShowBackButton?: (showBackButton: boolean) => void;
}

export const MobileAppContext = createContext<MobileAppContextProps>(undefined);
MobileAppContext.displayName = 'MobileAppContext';

export interface MobileAppProviderProps {
  children?: React.ReactNode;
}

export const MobileAppProvider: FC<MobileAppProviderProps> = ({ children }) => {
  const mobilePlugin = usePlugin(PluginMobileClient);
  const [showTabBar, _setShowTabBar] = React.useState(mobilePlugin.getPluginOptions()?.showTabBar ?? true);
  const setShowTabBar = (showTabBar: boolean) => {
    _setShowTabBar(showTabBar);
    mobilePlugin.updateOptions({ showTabBar });
  };
  const [showBackButton, _setShowBackButton] = React.useState(mobilePlugin.getPluginOptions()?.showBackButton ?? true);
  const setShowBackButton = (showBackButton: boolean) => {
    _setShowBackButton(showBackButton);
    mobilePlugin.updateOptions({ showBackButton });
  };

  return (
    <MobileAppContext.Provider value={{ showTabBar, setShowTabBar, showBackButton, setShowBackButton }}>
      <span
        className={css`
          .nb-message-back-action .adm-nav-bar-left {
            visibility: ${showBackButton ? 'visible' : 'hidden'};
          }
        `}
      >
        {children}
      </span>
    </MobileAppContext.Provider>
  );
};

export const useMobileApp = () => {
  return React.useContext(MobileAppContext);
};
