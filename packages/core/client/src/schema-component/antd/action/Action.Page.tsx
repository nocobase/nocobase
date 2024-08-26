/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecursionField, observer, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useActionContext } from '.';
import { BackButtonUsedInSubPage } from '../page/BackButtonUsedInSubPage';
import { TabsContextProvider, useTabsContext } from '../tabs/context';
import { useActionPageStyle } from './Action.Page.style';
import { usePopupOrSubpagesContainerDOM } from './hooks/usePopupSlotDOM';

export function ActionPage({ level }) {
  const filedSchema = useFieldSchema();
  const ctx = useActionContext();
  const { getContainerDOM } = usePopupOrSubpagesContainerDOM();
  const { styles } = useActionPageStyle();
  const tabContext = useTabsContext();

  const style = useMemo(() => {
    return {
      // 20 is the z-index value of the main page
      zIndex: 20 + level,
    };
  }, [level]);

  if (!ctx.visible) {
    return null;
  }

  const actionPageNode = (
    <div className={styles.container} style={style}>
      <TabsContextProvider {...tabContext} tabBarExtraContent={<BackButtonUsedInSubPage />}>
        <RecursionField schema={filedSchema} onlyRenderProperties />
      </TabsContextProvider>
    </div>
  );

  const container = getContainerDOM();

  if (container) {
    return createPortal(actionPageNode, container);
  }

  return actionPageNode;
}

ActionPage.Footer = observer(
  () => {
    // TODO: Implement in the future if needed
    return null;
  },
  { displayName: 'ActionPage.Footer' },
);

export default ActionPage;
