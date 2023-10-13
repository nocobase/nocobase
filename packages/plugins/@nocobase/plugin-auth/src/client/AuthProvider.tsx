import { useAPIClient } from '@nocobase/client';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const AuthProvider: React.FC = (props) => {
  const location = useLocation();
  const api = useAPIClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authenticator = params.get('authenticator');
    const token = params.get('token');
    if (token) {
      api.auth.setToken(token);
      api.auth.setAuthenticator(authenticator);
    }
  });
  return <>{props.children}</>;
};
