/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FC, default as React } from 'react';
import { TabsContextProvider } from '../tabs/context';

export const TabsPropsProvider: FC<{ activeKey: string; onTabClick: (key: string) => void }> = ({
  children,
  activeKey,
  onTabClick,
}) => {
  return (
    <TabsContextProvider activeKey={activeKey} onTabClick={onTabClick}>
      {children}
    </TabsContextProvider>
  );
};
