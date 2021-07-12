import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';

export function AuthLayout({ children, route }: any) {
  const location = useLocation();
  const history = useHistory();
  return (
    <div style={{ maxWidth: 320, margin: '0 auto' }}>
      <h1>NocoBase</h1>
      {children}
    </div>
  );
}

export default AuthLayout;
