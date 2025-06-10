/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import { MobileTabBarItem } from '@nocobase/plugin-mobile/client';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startMsgSSEStreamWithRetry, unreadMsgsCountObs, updateUnreadMsgsCount } from '../../observables';

const InnerMobileTabBarMessageItem = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const onClick = () => {
    navigate('/page/in-app-message');
  };

  useEffect(() => {
    const disposes: Array<() => void> = [];
    disposes.push(startMsgSSEStreamWithRetry());
    const disposeAll = () => {
      while (disposes.length > 0) {
        const dispose = disposes.pop();
        dispose && dispose();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        disposes.push(startMsgSSEStreamWithRetry());
      } else {
        disposeAll();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      disposeAll();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
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
