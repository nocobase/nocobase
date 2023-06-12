import { TabsProps } from 'antd';
import React from 'react';

const TabsContext = React.createContext<TabsProps>({});

export const TabsContextProvider: React.FC<TabsProps> = ({ children, ...props }) => {
  return <TabsContext.Provider value={props}>{children}</TabsContext.Provider>;
};

export const useTabsContext = () => {
  return React.useContext(TabsContext);
};
