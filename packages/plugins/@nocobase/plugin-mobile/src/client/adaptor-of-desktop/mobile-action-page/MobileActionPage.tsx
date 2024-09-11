/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecursionField, useField, useFieldSchema } from '@formily/react';
import {
  BackButtonUsedInSubPage,
  SchemaComponent,
  TabsContextProvider,
  useActionContext,
  useTabsContext,
} from '@nocobase/client';
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BasicZIndexProvider, MIN_Z_INDEX_INCREMENT, useBasicZIndex } from '../BasicZIndexProvider';
import { useMobileActionPageStyle } from './MobileActionPage.style';
import { MobileTabsForMobileActionPage } from './MobileTabsForMobileActionPage';

const components = { Tabs: MobileTabsForMobileActionPage };

/**
 * 在移动端通过 Action 按钮打开的页面
 * @returns
 */
export const MobileActionPage = ({ level, footerNodeName }) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const ctx = useActionContext();
  const { styles } = useMobileActionPageStyle();
  const tabContext = useTabsContext();
  const containerDOM = useMemo(() => document.querySelector('.nb-mobile-subpages-slot'), []);
  const { basicZIndex } = useBasicZIndex();

  // in nested popups, basicZIndex is an accumulated value to ensure that
  // the z-index of the current level is always higher than the previous level
  const newZIndex = basicZIndex + MIN_Z_INDEX_INCREMENT + (level || 1);

  const footerSchema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === footerNodeName) {
      return s;
    }
    return buf;
  });

  const zIndexStyle = useMemo(() => {
    return {
      zIndex: newZIndex,
    };
  }, [newZIndex]);

  if (!ctx.visible) {
    return null;
  }

  const actionPageNode = (
    <BasicZIndexProvider basicZIndex={newZIndex}>
      <div className={styles.container} style={zIndexStyle}>
        <TabsContextProvider {...tabContext} tabBarExtraContent={<BackButtonUsedInSubPage />} tabBarGutter={48}>
          <SchemaComponent components={components} schema={fieldSchema} onlyRenderProperties />
        </TabsContextProvider>
        {footerSchema && (
          <div className={styles.footer} style={zIndexStyle}>
            <RecursionField
              basePath={field.address}
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => {
                return s['x-component'] === footerNodeName;
              }}
            />
          </div>
        )}
      </div>
    </BasicZIndexProvider>
  );

  if (containerDOM) {
    return createPortal(actionPageNode, containerDOM);
  }

  return actionPageNode;
};
