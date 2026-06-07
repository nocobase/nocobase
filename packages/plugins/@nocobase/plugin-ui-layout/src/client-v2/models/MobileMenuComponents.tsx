/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme } from 'antd';
import React from 'react';
import { IconPicker, zIndexContext } from './mobileFlowCompat';

// FlowSettings dialogs can sit above normal popups, so nested icon popovers need an extra local layer.
const MOBILE_MENU_SETTINGS_OVERLAY_Z_INDEX_OFFSET = 5000;

export const MobileMenuSettingsIconPicker = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof IconPicker>>(
  (props, ref) => {
    const { token } = theme.useToken();
    const popoverBaseZIndex = (token.zIndexPopupBase || 1000) + MOBILE_MENU_SETTINGS_OVERLAY_Z_INDEX_OFFSET;

    return (
      <div ref={ref}>
        <zIndexContext.Provider value={popoverBaseZIndex}>
          <IconPicker {...props} />
        </zIndexContext.Provider>
      </div>
    );
  },
);

MobileMenuSettingsIconPicker.displayName = 'MobileMenuSettingsIconPicker';
