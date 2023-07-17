import React, { useMemo } from 'react';
import { Application } from '../application';

/**
 * 运行整个 App 所需要的所有上下文
 */
const AppContextProvider = ({ children }: { children?: React.ReactNode }) => {
  const app = useMemo(() => {
    return new Application({});
  }, []);

  const Provider = app.getComposeProviders();

  return <Provider>{children}</Provider>;
};

AppContextProvider.displayName = 'AppContextProvider';

export default AppContextProvider;
