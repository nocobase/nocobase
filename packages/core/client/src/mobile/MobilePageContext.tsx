/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, createContext } from 'react';

export interface MobilePageContextProps {
  /**
   * @default true
   */
  displayPageHeader?: boolean;
  /**
   * @default true
   */
  displayNavigationBar?: boolean;
  /**
   * @default true
   */
  displayPageTitle?: boolean;
  /**
   * @default false
   */
  displayTabs?: boolean;
}

export const MobilePageContext = createContext<MobilePageContextProps>(null);
MobilePageContext.displayName = 'MobilePageContext';

export interface MobilePageProviderProps extends MobilePageContextProps {
  children?: React.ReactNode;
}

export const MobilePageProvider: FC<MobilePageProviderProps> = ({ children, ...props }) => {
  return <MobilePageContext.Provider value={props}>{children}</MobilePageContext.Provider>;
};

export const useMobilePage = () => {
  return React.useContext(MobilePageContext);
};
