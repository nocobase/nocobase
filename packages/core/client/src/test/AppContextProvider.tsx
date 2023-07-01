import React, { useMemo } from 'react';
import { Application, compose } from '../application';

/**
 * 运行整个 App 所需要的所有上下文
 */
const AppContextProvider = ({ children }: { children?: React.ReactNode }) => {
  const app = useMemo(() => {
    return new Application({});
  }, []);

  return compose(...app.providers)(({ children }) => {
    return <>{children}</>;
  })({ children });
};

AppContextProvider.displayName = 'AppContextProvider';

export default AppContextProvider;
