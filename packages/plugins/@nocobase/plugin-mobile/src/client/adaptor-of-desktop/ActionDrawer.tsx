/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useFieldSchema } from '@formily/react';
import { Action, SchemaComponent, useActionContext } from '@nocobase/client';
import { Popup } from 'antd-mobile';
import React, { useCallback, useEffect, useState } from 'react';

export const ActionDrawerUsedInMobile = observer((props) => {
  const fieldSchema = useFieldSchema();
  const { visible, setVisible } = useActionContext();
  const [mobileContainer] = useState<HTMLElement>(() => document.querySelector('.mobile-container') as HTMLElement);

  const closePopup = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  return (
    <Popup
      visible={visible}
      onClose={closePopup}
      onMaskClick={closePopup}
      getContainer={() => mobileContainer}
      bodyStyle={{
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        minHeight: '40vh',
        maxHeight: 'calc(100% - var(--nb-mobile-page-header-height))',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '12px',
      }}
      showCloseButton
      closeOnSwipe
    >
      <SchemaComponent schema={fieldSchema} onlyRenderProperties />
    </Popup>
  );
});

ActionDrawerUsedInMobile.displayName = 'ActionDrawerUsedInMobile';

const originalActionDrawer = Action.Drawer;

/**
 * adapt Action.Drawer to mobile
 */
export const useToAdaptActionDrawerToMobile = () => {
  Action.Drawer = ActionDrawerUsedInMobile;

  useEffect(() => {
    return () => {
      Action.Drawer = originalActionDrawer;
    };
  }, []);
};
