/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Public surface of the v2 table primitive. Internal helpers (utils, styles,
// SelectionCell, RowOverlayPreview, etc.) stay unexported — they're
// implementation details of `Table` and are not part of the package API.
export * from './Table';
