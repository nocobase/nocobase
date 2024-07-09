/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, createContext } from 'react';
import { PluginMobileClient } from '../index';
import { usePlugin } from '@nocobase/client';

interface MobileAppContextProps {
  showTabBar?: boolean;
  setShowTabBar?: (showTabBar: boolean) => void;
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

  return <MobileAppContext.Provider value={{ showTabBar, setShowTabBar }}>{children}</MobileAppContext.Provider>;
};

export const useMobileApp = () => {
  return React.useContext(MobileAppContext);
};
