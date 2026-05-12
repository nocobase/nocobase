/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';

/**
 * Marker class for the client-v2 app shell. Applied as a `display: contents`
 * wrapper around `GlobalThemeProvider`'s children so any v2-only global
 * tweaks can be scoped under this class and avoid leaking into pages that
 * sit outside the v2 root (legacy v1 apps mounted independently).
 *
 * Trade-off: in hybrid mode where v1 schema pages render *inside* the v2
 * shell, they will inherit these styles too. That's acceptable because they
 * also pick up everything else about the v2 visual context (theme, antd
 * token, etc.). If a future divergence is needed, add a more specific
 * `:not(.legacy-v1-page)` qualifier here.
 */
// Antd v5 has no labelFontWeight token, so a targeted descendant selector
// on the stable Form structure is the lowest-risk implementation for the
// "v2 forms get bolder labels" default.
export const v2AppShellClassName = css`
  .ant-form-item-label > label {
    font-weight: 600;
  }
`;
