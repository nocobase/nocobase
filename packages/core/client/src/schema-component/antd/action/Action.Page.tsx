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
import { useActionPageStyle } from './Action.Page.style';
import { ComposedActionDrawer } from './types';

export const ActionPage: ComposedActionDrawer = observer(
  (props: any) => {
    const filedSchema = useFieldSchema();
    const { visible } = useActionContext();
    const pageDOM = useMemo(() => document.querySelector('#nb-page-without-header-and-side'), []);
    const { styles } = useActionPageStyle();

    if (!visible) {
      return null;
    }

    const actionPageNode = (
      <div className={styles.container}>
        <RecursionField schema={filedSchema} onlyRenderProperties />
      </div>
    );

    return createPortal(actionPageNode, pageDOM);
  },
  { displayName: 'ActionPage' },
);

ActionPage.Footer = observer(
  () => {
    // TODO: Implement in the future if needed
    return null;
  },
  { displayName: 'ActionPage.Footer' },
);

export default ActionPage;
