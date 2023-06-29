import { ConfigProvider, type ThemeConfig } from 'antd';
import React, { createContext } from 'react';

const GlobalThemeContext = createContext<{
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
}>(null);

export const useGlobalTheme = () => {
  return React.useContext(GlobalThemeContext);
};

export const GlobalThemeProvider = ({ children }) => {
  const [theme, setTheme] = React.useState<ThemeConfig>({});

  return (
    <GlobalThemeContext.Provider value={{ theme, setTheme }}>
      <ConfigProvider theme={theme}>{children}</ConfigProvider>
    </GlobalThemeContext.Provider>
  );
};
