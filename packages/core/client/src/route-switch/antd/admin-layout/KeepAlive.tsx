/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, FC, useContext, useRef } from 'react';

const displayBlock = {
  display: 'block',
};

const displayNone = {
  display: 'none',
};

export const KeepAliveContext = createContext(true);

/**
 * 获取当前页面是否可见
 * @returns
 */
export const useKeepAlive = () => {
  const active = useContext(KeepAliveContext);
  return { active };
};

/**
 * Implements a Vue-like KeepAlive effect
 */
export const KeepAlive: FC<{ uid: string }> = React.memo(({ children, uid }) => {
  const renderedPageRef = useRef([]);

  if (!renderedPageRef.current.includes(uid)) {
    renderedPageRef.current.push(uid);
  }

  return (
    <>
      {renderedPageRef.current.map((renderedUid) => (
        <div key={renderedUid} style={renderedUid === uid ? displayBlock : displayNone}>
          <KeepAliveContext.Provider value={renderedUid === uid}>{children}</KeepAliveContext.Provider>
        </div>
      ))}
    </>
  );
});

KeepAlive.displayName = 'KeepAlive';
