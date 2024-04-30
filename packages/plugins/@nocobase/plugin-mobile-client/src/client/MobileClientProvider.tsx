/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
