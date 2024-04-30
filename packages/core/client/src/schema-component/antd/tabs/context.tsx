/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TabsProps } from 'antd';
import React from 'react';

interface TabsContextProps extends TabsProps {
  PaneRoot?: React.FC<any>;
}
const TabsContext = React.createContext<TabsContextProps>({});

export const TabsContextProvider: React.FC<TabsContextProps> = ({ children, ...props }) => {
  return <TabsContext.Provider value={props}>{children}</TabsContext.Provider>;
};

export const useTabsContext = () => {
  return React.useContext(TabsContext);
};
