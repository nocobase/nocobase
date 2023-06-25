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
