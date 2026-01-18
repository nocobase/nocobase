/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MIN_Z_INDEX_INCREMENT } from '../zIndex';
import { useMobileActionPageStyle } from './MobileActionPage.style';
import { MobileTabsForMobileActionPage } from './MobileTabsForMobileActionPage';
import {
  BackButtonUsedInSubPage,
  SchemaComponent,
  TabsContextProvider,
  useActionContext,
  useTabsContext,
  useZIndexContext,
  zIndexContext,
} from '../../../schema-component';
import { NocoBaseRecursionField } from '../../..';

const components = { Tabs: MobileTabsForMobileActionPage };

export const MobileActionPage = ({ level, footerNodeName }) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const ctx = useActionContext();
  const { componentCls, hashId } = useMobileActionPageStyle();
  const tabContext = useTabsContext();
  const containerDOM = useMemo(() => document.querySelector('.nb-mobile-subpages-slot'), []);
  const parentZIndex = useZIndexContext();

  const newZIndex = parentZIndex + MIN_Z_INDEX_INCREMENT + (level || 1);

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
    <zIndexContext.Provider value={newZIndex}>
      <div className={`${componentCls} ${hashId}`} style={zIndexStyle}>
        <TabsContextProvider {...tabContext} tabBarExtraContent={<BackButtonUsedInSubPage />} tabBarGutter={48}>
          <SchemaComponent components={components} schema={fieldSchema} onlyRenderProperties />
        </TabsContextProvider>
        {footerSchema && (
          <div className="nb-mobile-action-page-footer" style={zIndexStyle}>
            <NocoBaseRecursionField
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
    </zIndexContext.Provider>
  );

  if (containerDOM) {
    return createPortal(actionPageNode, containerDOM);
  }

  return actionPageNode;
};
