/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Filter, withDynamicSchemaProps } from '@nocobase/client';
import { Popup } from 'antd-mobile';
import React, { useCallback, useEffect, useState } from 'react';

const OriginFilterAction = Filter.Action;

export const FilterAction = withDynamicSchemaProps((props) => {
  return (
    <OriginFilterAction
      {...props}
      Container={(props) => {
        const { visiblePopup, popupContainerRef } = usePopupContainer(props.open);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const closePopup = useCallback(() => {
          props.onOpenChange(false);
        }, [props]);

        return (
          <>
            {props.children}
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
                overflow: 'auto',
                padding: '12px',
              }}
              showCloseButton
              closeOnSwipe
            >
              {props.content}
              <div style={{ height: 50 }}></div>
            </Popup>
          </>
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
 * 之所以不直接使用 mobile-container 作为容器，是因为会影响到区块的拖拽功能。详见：https://nocobase.height.app/T-4959
 * @param visible
 * @returns
 */
export const usePopupContainer = (visible: boolean) => {
  const [mobileContainer] = useState<HTMLElement>(() => document.querySelector('.mobile-container'));
  const [visiblePopup, setVisiblePopup] = useState(false);
  const popupContainerRef = React.useRef<HTMLDivElement>(null);

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
    popupContainer.style.zIndex = '1000';

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
  }, [mobileContainer, visible]);

  return {
    visiblePopup,
    popupContainerRef,
  };
};
