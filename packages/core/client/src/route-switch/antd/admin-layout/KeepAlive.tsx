/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, {
  createContext,
  FC,
  useContext,
  // @ts-ignore
  useDeferredValue,
  useRef,
} from 'react';

const displayBlock = {
  display: 'block',
};

const displayNone = {
  display: 'none',
};

const KeepAliveContext = createContext(true);

export const KeepAliveProvider: FC<{ active: boolean }> = ({ children, active }) => {
  const deferredActive = useDeferredValue(active);

  return <KeepAliveContext.Provider value={deferredActive}>{children}</KeepAliveContext.Provider>;
};

/**
 * 获取当前页面是否可见
 * @returns
 */
export const useKeepAlive = () => {
  const active = useContext(KeepAliveContext);
  return { active };
};

interface KeepAliveProps {
  uid: string;
  children: (uid: string) => React.ReactNode;
}

/**
 * Implements a Vue-like KeepAlive effect
 */
export const KeepAlive: FC<KeepAliveProps> = React.memo(({ children, uid }) => {
  const renderedPageRef = useRef([]);

  if (!renderedPageRef.current.includes(uid)) {
    renderedPageRef.current.push(uid);
  }

  return (
    <>
      {renderedPageRef.current.map((renderedUid) => (
        <div key={renderedUid} style={renderedUid === uid ? displayBlock : displayNone}>
          <KeepAliveProvider active={renderedUid === uid}>{children(renderedUid)}</KeepAliveProvider>
        </div>
      ))}
    </>
  );
});

KeepAlive.displayName = 'KeepAlive';
