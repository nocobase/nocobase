/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, observer, useField, useFieldSchema } from '@formily/react';
import {
  Action,
  NocoBaseRecursionField,
  SchemaComponent,
  useActionContext,
  useZIndexContext,
  zIndexContext,
} from '@nocobase/client';
import { ConfigProvider } from 'antd';
import { Popup } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useMobileActionDrawerStyle } from './ActionDrawer.style';
import { usePopupContainer } from './FilterAction';
import { MIN_Z_INDEX_INCREMENT } from './zIndex';

export const ActionDrawerUsedInMobile: any = observer((props: { footerNodeName?: string }) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { visible, setVisible } = useActionContext();
  const { popupContainerRef, visiblePopup } = usePopupContainer(visible);
  const { componentCls, hashId } = useMobileActionDrawerStyle();
  const parentZIndex = useZIndexContext();

  // this schema need to add padding in the content area of the popup
  const isSpecialSchema = isChangePasswordSchema(fieldSchema) || isEditProfileSchema(fieldSchema);

  const footerNodeName = isSpecialSchema ? 'Action.Drawer.Footer' : props.footerNodeName;

  const specialStyle = isSpecialSchema ? { backgroundColor: 'white' } : {};

  const newZIndex = parentZIndex + MIN_Z_INDEX_INCREMENT;

  const zIndexStyle = useMemo(() => {
    return {
      zIndex: newZIndex,
    };
  }, [newZIndex]);

  const footerSchema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === footerNodeName) {
      return s;
    }
    return buf;
  });

  const title = field.title || '';
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
        zIndexPopupBase: newZIndex,
      },
    };
  }, [newZIndex]);

  return (
    <zIndexContext.Provider value={newZIndex}>
      <ConfigProvider theme={theme}>
        <Popup
          className={`${componentCls} ${hashId}`}
          visible={visiblePopup}
          onClose={closePopup}
          onMaskClick={closePopup}
          getContainer={() => popupContainerRef.current}
          bodyClassName="nb-mobile-action-drawer-body"
          bodyStyle={zIndexStyle}
          maskStyle={zIndexStyle}
          closeOnSwipe
        >
          <div className="nb-mobile-action-drawer-header">
            {/* used to make the title center */}
            <span className="nb-mobile-action-drawer-placeholder">
              <CloseOutline />
            </span>
            <span>{title}</span>
            <span className="nb-mobile-action-drawer-close-icon" onClick={closePopup}>
              <CloseOutline />
            </span>
          </div>
          {isSpecialSchema ? (
            <div style={{ padding: 12, ...specialStyle }}>
              <SchemaComponent
                schema={fieldSchema}
                filterProperties={(s) => {
                  return s['x-component'] !== footerNodeName;
                }}
              />
            </div>
          ) : (
            <SchemaComponent
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => {
                return s['x-component'] !== footerNodeName;
              }}
            />
          )}
          {footerSchema ? (
            <div className="nb-mobile-action-drawer-footer" style={isSpecialSchema ? specialStyle : null}>
              <NocoBaseRecursionField
                basePath={field.address}
                schema={fieldSchema}
                onlyRenderProperties
                filterProperties={(s) => {
                  return s['x-component'] === footerNodeName;
                }}
              />
            </div>
          ) : null}
        </Popup>
      </ConfigProvider>
    </zIndexContext.Provider>
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

function isEditProfileSchema(schema: ISchema) {
  return schema.title === `{{t("Edit profile")}}`;
}

function isChangePasswordSchema(schema: ISchema) {
  return schema.title === `{{t("Change password")}}`;
}
