/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';

const BasicZIndexContext = React.createContext<{
  basicZIndex: number;
}>({
  basicZIndex: 0,
});

/**
 * used to accumulate z-index in nested popups
 * @param props
 * @returns
 */
export const BasicZIndexProvider: React.FC<{ basicZIndex: number }> = (props) => {
  const value = useMemo(() => ({ basicZIndex: props.basicZIndex }), [props.basicZIndex]);
  return <BasicZIndexContext.Provider value={value}>{props.children}</BasicZIndexContext.Provider>;
};

export const useBasicZIndex = () => {
  return React.useContext(BasicZIndexContext);
};

// minimum z-index increment
export const MIN_Z_INDEX_INCREMENT = 10;
