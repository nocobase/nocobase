/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConfigProvider } from 'antd';
import React, { FC, ReactNode, useCallback, useMemo } from 'react';
import { useMobileActionDrawerStyle } from './MobilePopup.style';
import { useTranslation } from 'react-i18next';
import { lazy } from '../lazy-helper';

const { Popup } = lazy(() => import('antd-mobile'), 'Popup');
const { CloseOutline } = lazy(() => import('antd-mobile-icons'), 'CloseOutline');

interface MobilePopupProps {
  title?: string;
  visible: boolean;
  minHeight?: number | string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

const getMobilePopupMaxHeight = () => {
  if (typeof CSS !== 'undefined' && CSS.supports?.('height', '100dvh')) {
    return 'calc(100dvh - var(--nb-mobile-page-header-height, 46px))';
  }

  return 'calc(100vh - var(--nb-mobile-page-header-height, 46px))';
};

export const MobilePopup: FC<MobilePopupProps> = (props) => {
  const { title, visible, onClose: closePopup, children, minHeight, className, footer } = props;
  const { t } = useTranslation();
  const { componentCls, hashId } = useMobileActionDrawerStyle();

  const bodyStyles = (props as MobilePopupProps & { styles?: { body?: React.CSSProperties } }).styles?.body;
  const defaultMaxHeight = getMobilePopupMaxHeight();
  const popupStyle = useMemo(() => {
    return {
      minHeight: bodyStyles?.minHeight ?? minHeight,
      height: bodyStyles?.height,
      maxHeight: bodyStyles?.maxHeight ?? defaultMaxHeight,
    };
  }, [bodyStyles?.height, bodyStyles?.maxHeight, bodyStyles?.minHeight, defaultMaxHeight, minHeight]);

  const bodyStyle = useMemo<React.CSSProperties>(() => {
    return {
      padding: 0,
      maxHeight: defaultMaxHeight,
      overflowY: 'auto',
      overflowX: 'hidden',
      ...bodyStyles,
    };
  }, [bodyStyles, defaultMaxHeight]);

  const handleCloseKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      closePopup();
    },
    [closePopup],
  );

  const theme = useMemo(() => {
    return {
      token: {
        paddingPageHorizontal: 8,
        paddingPageVertical: 8,
        marginBlock: 12,
        borderRadiusBlock: 8,
        fontSize: 14,
      },
    };
  }, []);

  return (
    <ConfigProvider theme={theme}>
      <Popup
        className={`${componentCls} ${hashId} ${className || ''}`}
        visible={visible}
        onClose={closePopup}
        onMaskClick={closePopup}
        bodyClassName="nb-mobile-action-drawer-body"
        bodyStyle={bodyStyle}
        style={popupStyle}
        destroyOnClose
      >
        <div className="nb-mobile-action-drawer-header">
          {/* used to make the title center */}
          <span className="nb-mobile-action-drawer-placeholder">
            <CloseOutline />
          </span>
          <span className="nb-mobile-action-drawer-title">{title}</span>
          <span
            className="nb-mobile-action-drawer-close-icon"
            onClick={closePopup}
            role="button"
            tabIndex={0}
            aria-label={t('Close')}
            onKeyDown={handleCloseKeyDown}
          >
            <CloseOutline />
          </span>
        </div>
        {children}
        {footer && <div className="nb-mobile-action-drawer-footer">{footer}</div>}
      </Popup>
    </ConfigProvider>
  );
};
