/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecursionField, observer, useFieldSchema } from '@formily/react';
import zIndexContext from 'antd/es/_util/zIndexContext';
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useActionContext } from '.';
import { BackButtonUsedInSubPage } from '../page/BackButtonUsedInSubPage';
import { TabsContextProvider, useTabsContext } from '../tabs/context';
import { useActionPageStyle } from './Action.Page.style';
import { usePopupOrSubpagesContainerDOM } from './hooks/usePopupSlotDOM';
import { useAntdZIndex } from './utils';

export function ActionPage({ level }) {
  const filedSchema = useFieldSchema();
  const ctx = useActionContext();
  const { getContainerDOM } = usePopupOrSubpagesContainerDOM();
  const { styles } = useActionPageStyle();
  const tabContext = useTabsContext();
  const antdZIndex = useAntdZIndex();

  const style = useMemo(() => {
    return {
      zIndex: antdZIndex + (level || 0),
    };
  }, [antdZIndex, level]);

  if (!ctx.visible) {
    return null;
  }

  const actionPageNode = (
    <div className={styles.container} style={style}>
      <TabsContextProvider {...tabContext} tabBarExtraContent={<BackButtonUsedInSubPage />}>
        <zIndexContext.Provider value={style.zIndex}>
          <RecursionField schema={filedSchema} onlyRenderProperties />
        </zIndexContext.Provider>
      </TabsContextProvider>
    </div>
  );

  const container = getContainerDOM();

  return createPortal(actionPageNode, container || document.body);
}

ActionPage.Footer = observer(
  () => {
    // TODO: Implement in the future if needed
    return null;
  },
  { displayName: 'ActionPage.Footer' },
);

export default ActionPage;
