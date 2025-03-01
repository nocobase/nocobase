/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useFieldSchema } from '@formily/react';
import React, { FC, startTransition, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ActionContextNoRerender, useActionContext } from '.';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { BackButtonUsedInSubPage } from '../page/BackButtonUsedInSubPage';
import { TabsContextProvider, useTabsContext } from '../tabs/context';
import { useActionPageStyle } from './Action.Page.style';
import { usePopupOrSubpagesContainerDOM } from './hooks/usePopupSlotDOM';
import { getZIndex, useZIndexContext, zIndexContext } from './zIndexContext';

const ActionPageContent: FC<{ schema: any }> = React.memo(({ schema }) => {
  // Improve the speed of opening the page
  const [deferredVisible, setDeferredVisible] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setDeferredVisible(true);
    });
  }, []);

  if (!deferredVisible) {
    return null;
  }

  return <NocoBaseRecursionField schema={schema} onlyRenderProperties />;
});

export function ActionPage({ level }) {
  const filedSchema = useFieldSchema();
  const ctx = useActionContext();
  const { getContainerDOM } = usePopupOrSubpagesContainerDOM();
  const { componentCls, hashId } = useActionPageStyle();
  const tabContext = useTabsContext();
  const parentZIndex = useZIndexContext();

  const style = useMemo(() => {
    return {
      zIndex: getZIndex('page', parentZIndex, level || 0),
    };
  }, [parentZIndex, level]);

  if (!ctx.visible) {
    return null;
  }

  const actionPageNode = (
    <div className={`${componentCls} ${hashId}`} style={style}>
      <ActionContextNoRerender>
        <TabsContextProvider {...tabContext} tabBarExtraContent={<BackButtonUsedInSubPage />}>
          <zIndexContext.Provider value={style.zIndex}>
            <ActionPageContent schema={filedSchema} />
          </zIndexContext.Provider>
        </TabsContextProvider>
      </ActionContextNoRerender>
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
