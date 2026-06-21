/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { injectGlobal } from '@emotion/css';

// Antd v5 has no labelFontWeight token, so a descendant selector on the
// stable Form structure is the lowest-risk implementation for the bolder
// form label default. Injected globally because v1's GlobalThemeProvider
// re-exports v2's, so any v1 app served from this codebase goes through
// the same provider and should get the same defaults.
injectGlobal`
  .ant-form-item-label > label {
    font-weight: 600;
  }

  .nb-hidden {
    display: none;
  }

  .nb-dialog-overflow-hidden {
    .ant-modal-content {
      overflow: hidden;
    }
  }
`;
