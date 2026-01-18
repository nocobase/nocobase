/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-disable react-hooks/rules-of-hooks */
import { ConfigProvider } from 'antd';
import { Popup } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isDesktop } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import { useMobileActionDrawerStyle } from './ActionDrawer.style';
import { MIN_Z_INDEX_INCREMENT } from './zIndex';
import { withDynamicSchemaProps } from '../../hoc/withDynamicSchemaProps';
import { Filter, useZIndexContext } from '../../schema-component';

const OriginFilterAction = Filter.Action;

export const FilterAction = withDynamicSchemaProps((props) => {
  return (
    <OriginFilterAction
      {...props}
      Container={(containerProps) => {
        const { visiblePopup, popupContainerRef } = usePopupContainer(containerProps.open);
        const parentZIndex = useZIndexContext();
        const { componentCls, hashId } = useMobileActionDrawerStyle();
        const { t } = useTranslation();

        const newZIndex = parentZIndex + MIN_Z_INDEX_INCREMENT;

        const closePopup = useCallback(() => {
          containerProps.onOpenChange(false);
        }, [containerProps]);

        const theme = useMemo(() => {
          return {
            token: {
              zIndexPopupBase: newZIndex,
            },
          };
        }, [newZIndex]);

        const bodyStyle = useMemo(
          () => ({
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            maxHeight: 'calc(100% - var(--nb-mobile-page-header-height))',
            overflow: 'auto',
            zIndex: newZIndex,
          }),
          [newZIndex],
        );

        const zIndexStyle = useMemo(() => ({ zIndex: newZIndex }), [newZIndex]);

        const getContainer = useCallback(() => popupContainerRef.current, [popupContainerRef]);

        return (
          <ConfigProvider theme={theme}>
            {containerProps.children}
            <Popup
              className={`${componentCls} ${hashId}`}
              visible={visiblePopup}
              onClose={closePopup}
              onMaskClick={closePopup}
              getContainer={getContainer}
              bodyStyle={bodyStyle}
              maskStyle={zIndexStyle}
              style={zIndexStyle}
              closeOnSwipe
            >
              <div className="nb-mobile-action-drawer-header">
                <span className="nb-mobile-action-drawer-placeholder">
                  <CloseOutline />
                </span>
                <span>{t('Filter')}</span>
                <span className="nb-mobile-action-drawer-close-icon" onClick={closePopup}>
                  <CloseOutline />
                </span>
              </div>
              <div style={{ padding: 12 }}>{containerProps.content}</div>
              <div style={{ height: 150 }}></div>
            </Popup>
          </ConfigProvider>
        );
      }}
    />
  );
});

FilterAction.displayName = 'FilterAction';

const originalFilterAction = Filter.Action;

export const useToAdaptFilterActionToMobile = () => {
  Filter.Action = FilterAction;

  useEffect(() => {
    return () => {
      Filter.Action = originalFilterAction;
    };
  }, []);
};

const POPUP_ANIMATION_DELAY = 300;

export const usePopupContainer = (visible: boolean, animationDelay = POPUP_ANIMATION_DELAY) => {
  const [mobileContainer] = useState<HTMLElement>(() => document.querySelector('.mobile-container') || document.body);

  if (!isDesktop) {
    return {
      visiblePopup: visible,
      popupContainerRef: { current: mobileContainer as HTMLDivElement },
    };
  }

  const [visiblePopup, setVisiblePopup] = useState(false);
  const popupContainerRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const parentZIndex = useZIndexContext();

  const newZIndex = parentZIndex + MIN_Z_INDEX_INCREMENT;

  const cleanupPopupContainer = React.useCallback(() => {
    if (popupContainerRef.current && mobileContainer.contains(popupContainerRef.current)) {
      try {
        mobileContainer.removeChild(popupContainerRef.current);
      } catch (error) {
        console.warn('Failed to remove popup container:', error);
      }
      popupContainerRef.current = null;
    }
  }, [mobileContainer]);

  const scheduleCleanup = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(cleanupPopupContainer, animationDelay);
  }, [cleanupPopupContainer, animationDelay]);

  const createPopupContainerStyles = React.useCallback(
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
    popupContainer.setAttribute('aria-label', 'Filter popup container');

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
