/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { observer } from '@formily/reactive-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MobileTabBarItem } from '@nocobase/plugin-mobile/client';
import { unreadMsgsCountObs, startMsgSSEStreamWithRetry, updateUnreadMsgsCount } from '../../observables';

const InnerMobileTabBarMessageItem = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const onClick = () => {
    navigate('/page/in-app-message');
  };
  useEffect(() => {
    startMsgSSEStreamWithRetry();
    updateUnreadMsgsCount();
  }, []);
  const selected = props.url && location.pathname.startsWith(props.url);

  return (
    <MobileTabBarItem
      {...{
        ...props,
        onClick,
        badge: unreadMsgsCountObs.value && unreadMsgsCountObs.value > 0 ? unreadMsgsCountObs.value : undefined,
        selected,
      }}
    />
  );
};

export const MobileTabBarMessageItem = observer(InnerMobileTabBarMessageItem, {
  displayName: 'MobileTabBarMessageItem',
});
