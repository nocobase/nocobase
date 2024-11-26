/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '@nocobase/client';

export const useInternalPopoverNesterUsedInMobileStyle = genStyleHook(
  'nb-internal-popover-nester-used-in-mobile',
  (token) => {
    const { componentCls } = token;

    return {
      [componentCls]: {
        '.nb-internal-popover-nester-used-in-mobile-header': {
          height: 'var(--nb-mobile-page-header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${token.colorSplit}`,
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1000,

          // to match the button named 'Add block'
          '& + .nb-grid-container > .nb-grid > .nb-grid-warp > .ant-btn': {
            // 18px is the token marginBlock value
            margin: '12px 12px calc(12px + 18px)',
          },
        },

        '.nb-internal-popover-nester-used-in-mobile-placeholder': {
          display: 'inline-block',
          padding: '12px',
          visibility: 'hidden',
        },

        '.nb-internal-popover-nester-used-in-mobile-close-icon': {
          display: 'inline-block',
          padding: '12px',
          cursor: 'pointer',
        },

        '.nb-internal-popover-nester-used-in-mobile-body': {
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          maxHeight: 'calc(100% - var(--nb-mobile-page-header-height))',
          overflowY: 'auto',
          overflowX: 'hidden',
          // backgroundColor: token.colorBgLayout,

          '.popover-subform-container': {
            minWidth: 'initial',
            maxWidth: 'initial',
            maxHeight: 'initial',
            overflow: 'hidden',
            '.ant-card': {
              borderRadius: 0,
            },
          },
        },

        '.nb-internal-popover-nester-used-in-mobile-footer': {
          padding: '8px var(--nb-mobile-page-tabs-content-padding)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderTop: `1px solid ${token.colorSplit}`,
          backgroundColor: token.colorBgLayout,
        },
      },
    };
  },
);
