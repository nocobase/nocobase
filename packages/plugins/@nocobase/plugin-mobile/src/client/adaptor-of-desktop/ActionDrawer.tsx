/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, observer, Schema, useField, useFieldSchema } from '@formily/react';
import {
  Action,
  FlagProvider,
  NocoBaseRecursionField,
  SchemaComponent,
  useActionContext,
  useGlobalTheme,
  useZIndexContext,
  zIndexContext,
} from '@nocobase/client';
import { ConfigProvider } from 'antd';
import { Popup } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import React, { FC, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMobileActionDrawerStyle } from './ActionDrawer.style';
import { usePopupContainer } from './FilterAction';
import { MIN_Z_INDEX_INCREMENT } from './zIndex';

export interface MobilePopupProps {
  title?: string;
  visible: boolean;
  minHeight?: number | string;
  onClose: () => void;
  children: ReactNode;
}

export const MobilePopup: FC<MobilePopupProps> = (props) => {
  const { title, visible, onClose: closePopup, children, minHeight } = props;
  const { t } = useTranslation();
  const { popupContainerRef } = usePopupContainer(visible);
  const { componentCls, hashId } = useMobileActionDrawerStyle();
  const parentZIndex = useZIndexContext();
  const { theme: globalTheme } = useGlobalTheme();

  const newZIndex = parentZIndex + MIN_Z_INDEX_INCREMENT;

  const zIndexStyle = useMemo(() => {
    return {
      zIndex: newZIndex,
      minHeight,
    };
  }, [newZIndex, minHeight]);

  const theme = useMemo(() => {
    return {
      ...globalTheme,
      token: {
        ...globalTheme.token,
        zIndexPopupBase: newZIndex,
        paddingPageHorizontal: 8,
        paddingPageVertical: 8,
        marginBlock: 12,
        borderRadiusBlock: 8,
        fontSize: 14,
      },
    };
  }, [globalTheme, newZIndex]);

  return (
    <zIndexContext.Provider value={newZIndex}>
      <ConfigProvider theme={theme}>
        <Popup
          className={`${componentCls} ${hashId}`}
          visible={visible}
          onClose={closePopup}
          onMaskClick={closePopup}
          getContainer={() => popupContainerRef.current}
          bodyClassName="nb-mobile-action-drawer-body"
          bodyStyle={zIndexStyle}
          maskStyle={zIndexStyle}
          style={zIndexStyle}
          destroyOnClose
        >
          <div className="nb-mobile-action-drawer-header">
            {/* used to make the title center */}
            <span className="nb-mobile-action-drawer-placeholder">
              <CloseOutline />
            </span>
            <span>{title}</span>
            <span
              className="nb-mobile-action-drawer-close-icon"
              onClick={closePopup}
              role="button"
              tabIndex={0}
              aria-label={t('Close')}
            >
              <CloseOutline />
            </span>
          </div>
          <FlagProvider isInMobileDrawer>{children}</FlagProvider>
        </Popup>
      </ConfigProvider>
    </zIndexContext.Provider>
  );
};

export const ActionDrawerUsedInMobile: any = observer((props: { footerNodeName?: string }) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { visible, setVisible } = useActionContext();
  const { visiblePopup } = usePopupContainer(visible);

  // 克隆的目的是为了把底部按钮的 schema 去掉，避免重复渲染。
  // 不使用 filterProperties 的原因是防止 Iphone 中出现卡死的问题，具体原因未知。
  const clonedFieldSchema = useMemo(() => {
    return new Schema(fieldSchema.toJSON());
  }, [fieldSchema]);

  // this schema need to add padding in the content area of the popup
  const isSpecialSchema = isChangePasswordSchema(fieldSchema) || isEditProfileSchema(fieldSchema);

  const footerNodeName = isSpecialSchema ? 'Action.Drawer.Footer' : props.footerNodeName;

  const specialStyle = isSpecialSchema ? { backgroundColor: 'white' } : {};

  const footerSchema = useMemo(() => {
    return clonedFieldSchema.reduceProperties((buf, s) => {
      if (s['x-component'] === footerNodeName) {
        s.parent.removeProperty(s.name); // 移除掉底部按钮区域的 schema
        return s;
      }
      return buf;
    }) as Schema;
  }, [clonedFieldSchema, footerNodeName]);

  const title = field.title || '';

  const closePopup = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const popupContent = isSpecialSchema ? (
    <div style={{ padding: 12, ...specialStyle }}>
      <SchemaComponent basePath={field.address} schema={clonedFieldSchema} />
    </div>
  ) : (
    <SchemaComponent basePath={field.address} schema={clonedFieldSchema} />
  );

  const footerContent = footerSchema ? (
    <div className="nb-mobile-action-drawer-footer" style={isSpecialSchema ? specialStyle : null}>
      <NocoBaseRecursionField basePath={field.address} schema={footerSchema} />
    </div>
  ) : null;

  return (
    <MobilePopup title={title} visible={visiblePopup} onClose={closePopup}>
      {popupContent}
      {footerContent}
    </MobilePopup>
  );
});

ActionDrawerUsedInMobile.displayName = 'ActionDrawerUsedInMobile';

const originalActionDrawer = Action.Drawer;

/**
 * adapt Action.Drawer to mobile
 */
export const useToAdaptActionDrawerToMobile = () => {
  Action.Drawer = ActionDrawerUsedInMobile;
  Action.Drawer.FootBar = (props) => {
    return <div style={{ display: 'flex', justifyContent: 'end', gap: 8 }}>{props.children}</div>;
  };

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
