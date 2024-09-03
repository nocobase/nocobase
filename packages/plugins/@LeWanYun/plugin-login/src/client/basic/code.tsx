/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useState, createContext, useContext, useEffect } from 'react';
const LWAuthLayoutContext = createContext({
  codeIsVisible: false,
  setCodeIsVisible: (isVisible: boolean) => {},
  loginShow: false,
  setLoginShow: (isVisible: boolean) => {},
  changePassword: false,
  setChangePassword: (isVisible: boolean) => {},
  LWuserID: '',
  setLWuserID: (id: string) => {},
});
export const useLWAuthContext = () => useContext(LWAuthLayoutContext);

export const LWAuthProvider = ({ children }) => {
  const [codeIsVisible, setCodeIsVisible] = useState(false);
  const [loginShow, setLoginShow] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [LWuserID, setLWuserID] = useState('');

  return (
    <LWAuthLayoutContext.Provider
      value={{
        codeIsVisible,
        setCodeIsVisible,
        loginShow,
        setLoginShow,
        changePassword,
        setChangePassword,
        LWuserID,
        setLWuserID,
      }}
    >
      {children}
    </LWAuthLayoutContext.Provider>
  );
};
