/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Action, SchemaComponent, useActionContext } from '@nocobase/client';
import { Popup } from 'antd-mobile';
import React, { useCallback, useEffect } from 'react';
import { useMobileActionDrawerStyle } from './ActionDrawer.style';
import { usePopupContainer } from './FilterAction';

export const ActionDrawerUsedInMobile = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { visible, setVisible } = useActionContext();
  const { popupContainerRef, visiblePopup } = usePopupContainer(visible);
  const { styles } = useMobileActionDrawerStyle();
  const footerSchema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === props.footerNodeName) {
      return s;
    }
    return buf;
  });

  const closePopup = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  return (
    <Popup
      visible={visiblePopup}
      onClose={closePopup}
      onMaskClick={closePopup}
      getContainer={() => popupContainerRef.current}
      bodyStyle={{
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        minHeight: '40vh',
        maxHeight: 'calc(100% - var(--nb-mobile-page-header-height))',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
      showCloseButton
      closeOnSwipe
    >
      <div style={{ padding: '24px 12px 12px' }}>
        <SchemaComponent
          schema={fieldSchema}
          onlyRenderProperties
          filterProperties={(s) => {
            return s['x-component'] !== props.footerNodeName;
          }}
        />
      </div>
      <div style={{ height: 50 }}></div>
      {footerSchema ? (
        <div className={styles.footer}>
          <RecursionField
            basePath={field.address}
            schema={fieldSchema}
            onlyRenderProperties
            filterProperties={(s) => {
              return s['x-component'] === props.footerNodeName;
            }}
          />
        </div>
      ) : null}
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
