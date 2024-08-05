/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Action, SchemaComponent, useActionContext, useCompile } from '@nocobase/client';
import { ConfigProvider } from 'antd';
import { Popup } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useMobileActionDrawerStyle } from './ActionDrawer.style';
import { usePopupContainer } from './FilterAction';

export const ActionDrawerUsedInMobile = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { visible, setVisible } = useActionContext();
  const { popupContainerRef, visiblePopup } = usePopupContainer(visible);
  const { styles } = useMobileActionDrawerStyle();
  const compile = useCompile();

  const footerSchema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === props.footerNodeName) {
      return s;
    }
    return buf;
  });

  const title = compile(fieldSchema.title) || '';
  const marginBlock = 18;

  const closePopup = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const theme = useMemo(() => {
    return {
      token: {
        marginBlock,
        borderRadiusBlock: 0,
        boxShadowTertiary: 'none',
        zIndexPopupBase: 2000,
      },
    };
  }, []);

  return (
    <ConfigProvider theme={theme}>
      <Popup
        visible={visiblePopup}
        onClose={closePopup}
        onMaskClick={closePopup}
        getContainer={() => popupContainerRef.current}
        bodyClassName={styles.body}
        closeOnSwipe
      >
        <div className={styles.header}>
          {/* used to make the title center */}
          <span className={styles.placeholder}>
            <CloseOutline />
          </span>
          <span>{title}</span>
          <span className={styles.closeIcon} onClick={closePopup}>
            <CloseOutline />
          </span>
        </div>
        <SchemaComponent
          schema={fieldSchema}
          onlyRenderProperties
          filterProperties={(s) => {
            return s['x-component'] !== props.footerNodeName;
          }}
        />
        {/* used to offset the margin-bottom of the last block */}
        {/* The number 1 is to prevent the scroll bar from appearing */}
        <div style={{ marginBottom: 1 - marginBlock }}></div>
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
    </ConfigProvider>
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
