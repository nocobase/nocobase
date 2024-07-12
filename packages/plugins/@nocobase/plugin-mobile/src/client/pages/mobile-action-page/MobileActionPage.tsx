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
import { ConfigProvider } from 'antd';
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMobileActionPageStyle } from './MobileActionPage.style';

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
      zIndex: level,
      '--mobile-action-page-header-height': '49px',
      '--mobile-action-page-tab-height': '44px',
    };
  }, [level]);

  if (!ctx.visible) {
    return null;
  }

  const actionPageNode = (
    <div className={styles.container} style={style}>
      <div className={styles.header}>
        <BackButtonUsedInSubPage />
      </div>
      <TabsContextProvider {...tabContext} tabBarExtraContent={null} tabBarGutter={48}>
        <ConfigProvider
          theme={{
            token: {
              // @ts-ignore
              marginBlock: 18,
            },
          }}
        >
          <SchemaComponent schema={filedSchema} onlyRenderProperties />
        </ConfigProvider>
      </TabsContextProvider>
    </div>
  );

  if (containerDOM) {
    return createPortal(actionPageNode, containerDOM);
  }

  return actionPageNode;
};
