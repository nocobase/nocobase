/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import {
  BackButtonUsedInSubPage,
  SchemaComponent,
  TabsContextProvider,
  useActionContext,
  useTabsContext,
} from '@nocobase/client';
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMobileActionPageStyle } from './MobileActionPage.style';
import { MobileTabsForMobileActionPage } from './MobileTabsForMobileActionPage';

const components = { Tabs: MobileTabsForMobileActionPage };

/**
 * 在移动端通过 Action 按钮打开的页面
 * @returns
 */
export const MobileActionPage = ({ level }) => {
  const filedSchema = useFieldSchema();
  const ctx = useActionContext();
  const { styles } = useMobileActionPageStyle();
  const tabContext = useTabsContext();
  const containerDOM = useMemo(() => document.querySelector('.nb-mobile-subpages-slot'), []);

  const style = useMemo(() => {
    return {
      // 10 为基数，是为了要确保能大于 Table 中的悬浮行的 z-index
      zIndex: 10 + level,
    };
  }, [level]);

  if (!ctx.visible) {
    return null;
  }

  const actionPageNode = (
    <div className={styles.container} style={style}>
      <TabsContextProvider {...tabContext} tabBarExtraContent={<BackButtonUsedInSubPage />} tabBarGutter={48}>
        <SchemaComponent components={components} schema={filedSchema} onlyRenderProperties />
      </TabsContextProvider>
    </div>
  );

  if (containerDOM) {
    return createPortal(actionPageNode, containerDOM);
  }

  return actionPageNode;
};
