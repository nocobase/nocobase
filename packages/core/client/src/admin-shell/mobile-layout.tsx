/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useContext, useMemo, useState } from 'react';

const IsMobileLayoutContext = React.createContext<{
  isMobileLayout: boolean;
  setIsMobileLayout: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  isMobileLayout: false,
  setIsMobileLayout: () => {},
});

export const MobileLayoutProvider: FC = (props) => {
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const value = useMemo(() => ({ isMobileLayout, setIsMobileLayout }), [isMobileLayout]);

  return <IsMobileLayoutContext.Provider value={value}>{props.children}</IsMobileLayoutContext.Provider>;
};

export const useMobileLayout = () => {
  const { isMobileLayout, setIsMobileLayout } = useContext(IsMobileLayoutContext);
  return { isMobileLayout, setIsMobileLayout };
};
