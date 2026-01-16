/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-disable react-hooks/rules-of-hooks */
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConfigProvider } from 'antd';
import { Popup } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isDesktop } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { FlagProvider } from '../flag-provider';
import { useGlobalTheme } from '../global-theme';
import { genStyleHook } from '../schema-component/antd/__builtins__/style';
import { useZIndexContext, zIndexContext } from '../schema-component/antd/action/zIndexContext';

// minimum z-index increment
const MIN_Z_INDEX_INCREMENT = 10;

// 动画延迟时间常量
const POPUP_ANIMATION_DELAY = 300;

const useMobilePopupStyle = genStyleHook('nb-mobile-popup', (token) => {
  const { componentCls } = token;
  return {
    [componentCls]: {
      '.nb-mobile-popup-header': {
        height: 'var(--nb-mobile-page-header-height, 50px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${token.colorSplit}`,
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1000,
      },

      '.nb-mobile-popup-placeholder': {
        display: 'inline-block',
        padding: 12,
        visibility: 'hidden',
      },

      '.nb-mobile-popup-close-icon': {
        display: 'inline-block',
        padding: 12,
        cursor: 'pointer',
      },

      '.nb-mobile-popup-body': {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        maxHeight: 'calc(100% - var(--nb-mobile-page-header-height, 50px))',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: token.colorBgLayout,
      },
    },
  };
});

/**
 * 为了解决在桌面端配置页面弹窗超出移动端页面范围的问题。
 */
const usePopupContainer = (visible: boolean, animationDelay = POPUP_ANIMATION_DELAY) => {
  const [mobileContainer] = useState<HTMLElement>(() => document.querySelector('.mobile-container') || document.body);

  // 仅需在桌面端创建弹窗容器
  if (!isDesktop) {
    return {
      visiblePopup: visible,
      popupContainerRef: { current: mobileContainer as HTMLDivElement },
    };
  }

  const [visiblePopup, setVisiblePopup] = useState(false);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parentZIndex = useZIndexContext();

  const newZIndex = parentZIndex + MIN_Z_INDEX_INCREMENT;

  const cleanupPopupContainer = useCallback(() => {
    if (popupContainerRef.current && mobileContainer.contains(popupContainerRef.current)) {
      try {
        mobileContainer.removeChild(popupContainerRef.current);
      } catch (error) {
        console.warn('Failed to remove popup container:', error);
      }
      popupContainerRef.current = null;
    }
  }, [mobileContainer]);

  const scheduleCleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(cleanupPopupContainer, animationDelay);
  }, [cleanupPopupContainer, animationDelay]);

  const createPopupContainerStyles = useCallback(
    (zIndex: number) => ({
      transform: 'translateZ(0)',
      position: 'absolute' as const,
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      overflow: 'hidden' as const,
      zIndex: zIndex.toString(),
    }),
    [],
  );

  useEffect(() => {
    if (!visible) {
      setVisiblePopup(false);
      if (popupContainerRef.current) {
        scheduleCleanup();
      }
      return;
    }

    const popupContainer = document.createElement('div');
    popupContainer.setAttribute('role', 'dialog');
    popupContainer.setAttribute('aria-modal', 'true');

    const styles = createPopupContainerStyles(newZIndex);
    Object.assign(popupContainer.style, styles);

    try {
      mobileContainer.appendChild(popupContainer);
      popupContainerRef.current = popupContainer;
      setVisiblePopup(true);
    } catch (error) {
      console.error('Failed to create popup container:', error);
      return;
    }

    return () => {
      scheduleCleanup();
    };
  }, [newZIndex, visible, scheduleCleanup, createPopupContainerStyles, mobileContainer, cleanupPopupContainer]);

  return {
    visiblePopup,
    popupContainerRef,
  };
};

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
  const { visiblePopup, popupContainerRef } = usePopupContainer(visible);
  const { componentCls, hashId } = useMobilePopupStyle();
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
        ...globalTheme?.token,
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
          visible={visiblePopup}
          onClose={closePopup}
          onMaskClick={closePopup}
          getContainer={() => popupContainerRef.current}
          bodyClassName="nb-mobile-popup-body"
          bodyStyle={zIndexStyle}
          maskStyle={zIndexStyle}
          style={zIndexStyle}
          destroyOnClose
        >
          <div className="nb-mobile-popup-header">
            <span className="nb-mobile-popup-placeholder">
              <CloseOutline />
            </span>
            <span>{title}</span>
            <span
              className="nb-mobile-popup-close-icon"
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
