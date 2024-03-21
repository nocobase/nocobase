import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isJSBridge } from './core/bridge';

export const MobileClientProvider = React.memo((props) => {
  const location = useLocation();
  const navigation = useNavigate();

  useEffect(() => {
    if (isJSBridge() && location.pathname === '/admin') {
      navigation('/mobile', { replace: true });
    }
  }, [location.pathname, navigation]);

  return <>{props.children}</>;
});
MobileClientProvider.displayName = 'MobileClientProvider';
