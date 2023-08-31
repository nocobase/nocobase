import { Authenticator, SchemaComponent, useSignup, useRedirect, useRecord, useAPIClient } from '@nocobase/client';
import React, { useEffect } from 'react';
import Cookies from 'js-cookie';

export default (props) => {
  const api = useAPIClient();
  const redirect = useRedirect();
  const name = Cookies.get('_sop_name_');
  const casUrl = Cookies.get('_sop_casUrl_');
  const isCasMod = Boolean(Cookies.get('_sop_mode_'));

  useEffect(() => {
    if (isCasMod) {
      Cookies.remove('_sop_mode_');
      window.location.replace(`${casUrl}/logout?service=${location.origin}/signup?authType=CAS`);
    }
  }, [isCasMod]);

  const login = async () => {
    await api.auth.signIn({ nickname: 'pages' }, name || 's_75h40l1cjvk');
    redirect();
  };

  useEffect(() => {
    !isCasMod && login();
  }, []);

  return <div>loading...</div>;
};
