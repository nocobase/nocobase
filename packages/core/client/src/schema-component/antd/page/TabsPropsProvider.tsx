/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FC, default as React, useEffect, useState } from 'react';
import { TabsContextProvider } from '../tabs/context';

export const TabsPropsProvider: FC<{ activeKey: string; onTabClick: (key: string) => void }> = ({
  children,
  activeKey,
  onTabClick,
}) => {
  const [_activeKey, setActiveKey] = useState(activeKey);

  useEffect(() => {
    // TODO: Suspect that Formily has a bug, the specific manifestation is: the params parameter in the schema is updated, but it is not refreshed when rendered.
    setTimeout(() => {
      setActiveKey(undefined);
    }, 100);
  });

  return (
    <TabsContextProvider activeKey={_activeKey} onTabClick={onTabClick}>
      {children}
    </TabsContextProvider>
  );
};
