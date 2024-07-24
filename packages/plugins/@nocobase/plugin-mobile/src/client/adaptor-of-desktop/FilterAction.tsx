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
import React, { useCallback, useState } from 'react';

const OriginFilterAction = Filter.Action;

export const FilterAction = withDynamicSchemaProps((props) => {
  const [mobileContainer] = useState<HTMLElement>(() => document.querySelector('.mobile-container'));
  return (
    <OriginFilterAction
      {...props}
      Container={(props) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const closePopup = useCallback(() => {
          props.onOpenChange(false);
        }, [props]);

        return (
          <>
            {props.children}
            <Popup
              visible={props.open}
              onClose={closePopup}
              onMaskClick={closePopup}
              getContainer={() => mobileContainer}
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
            </Popup>
          </>
        );
      }}
    />
  );
});

/**
 * 重置 FilterAction，使其样式更符合移动端
 */
export const usedToResetFilterActionForMobile = () => {
  Filter.Action = FilterAction;
};
