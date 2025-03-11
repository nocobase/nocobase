/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Filter, useZIndexContext, withDynamicSchemaProps } from '@nocobase/client';
import { ConfigProvider } from 'antd';
import { Popup } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMobileActionDrawerStyle } from './ActionDrawer.style';
import { MIN_Z_INDEX_INCREMENT } from './zIndex';

const OriginFilterAction = Filter.Action;

export const FilterAction = withDynamicSchemaProps((props) => {
  return (
    <OriginFilterAction
      {...props}
      Container={(props) => {
        const { visiblePopup, popupContainerRef } = usePopupContainer(props.open);
        const parentZIndex = useZIndexContext();
        const { componentCls, hashId } = useMobileActionDrawerStyle();
        const { t } = useTranslation();

        const newZIndex = parentZIndex + MIN_Z_INDEX_INCREMENT;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const closePopup = useCallback(() => {
          props.onOpenChange(false);
        }, [props]);

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
            {props.children}
            <Popup
              className={`${componentCls} ${hashId}`}
              visible={visiblePopup}
              onClose={closePopup}
              onMaskClick={closePopup}
              getContainer={getContainer}
              bodyStyle={bodyStyle}
              maskStyle={zIndexStyle}
              closeOnSwipe
            >
              <div className="nb-mobile-action-drawer-header">
                {/* used to make the title center */}
                <span className="nb-mobile-action-drawer-placeholder">
                  <CloseOutline />
                </span>
                <span>{t('Filter')}</span>
                <span className="nb-mobile-action-drawer-close-icon" onClick={closePopup}>
                  <CloseOutline />
                </span>
              </div>
              <div style={{ padding: 12 }}>{props.content}</div>
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

/**
 * adapt Filter.Action to mobile
 */
export const useToAdaptFilterActionToMobile = () => {
  Filter.Action = FilterAction;

  useEffect(() => {
    return () => {
      Filter.Action = originalFilterAction;
    };
  }, []);
};

/**
 * 之所以不直接在 mobile-container 中设置 transform，是因为会影响到子页面区块的拖拽功能。
 * @param visible
 * @returns
 */
export const usePopupContainer = (visible: boolean) => {
  const [mobileContainer] = useState<HTMLElement>(() => document.querySelector('.mobile-container') || document.body);
  const [visiblePopup, setVisiblePopup] = useState(false);
  const popupContainerRef = React.useRef<HTMLDivElement>(null);
  const parentZIndex = useZIndexContext();

  const newZIndex = parentZIndex + MIN_Z_INDEX_INCREMENT;

  useEffect(() => {
    if (!visible) {
      setVisiblePopup(false);
      if (popupContainerRef.current) {
        // Popup 动画都结束的时候再移除
        setTimeout(() => {
          mobileContainer.contains(popupContainerRef.current) && mobileContainer.removeChild(popupContainerRef.current);
          popupContainerRef.current = null;
        }, 300);
      }
      return;
    }

    const popupContainer = document.createElement('div');
    popupContainer.style.transform = 'translateZ(0)';
    popupContainer.style.position = 'absolute';
    popupContainer.style.top = '0';
    popupContainer.style.left = '0';
    popupContainer.style.right = '0';
    popupContainer.style.bottom = '0';
    popupContainer.style.overflow = 'hidden';
    popupContainer.style.zIndex = newZIndex.toString();

    mobileContainer.appendChild(popupContainer);
    popupContainerRef.current = popupContainer;

    setVisiblePopup(true);

    return () => {
      if (popupContainerRef.current) {
        // Popup 动画都结束的时候再移除
        setTimeout(() => {
          mobileContainer.contains(popupContainerRef.current) && mobileContainer.removeChild(popupContainerRef.current);
          popupContainerRef.current = null;
        }, 300);
      }
    };
  }, [mobileContainer, newZIndex, visible]);

  return {
    visiblePopup,
    popupContainerRef,
  };
};
