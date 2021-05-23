import React from 'react';
import { Button } from 'antd';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { refreshGlobalAction } from '../../';

export function AuthLayout({ children, route }: any) {
  const location = useLocation();
  const history = useHistory();
  return (
    <div>
      <h1>Auth</h1>
      <Button
        onClick={async () => {
          await refreshGlobalAction('routes:getAccessible');
          history.push('/');
        }}
      >
        登录
      </Button>
      {children}
    </div>
  );
}

export default AuthLayout;
