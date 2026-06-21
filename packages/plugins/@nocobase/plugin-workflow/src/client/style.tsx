/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The canvas stylesheet now lives in `src/client-v2/canvas/style.tsx` and is
 * shared by both canvases (ADR-0003). This module re-exports it via the allowed
 * `v1 → v2` import direction so existing v1 import sites (`import useStyles from
 * '../style'`) are unchanged. Delete this file when the legacy canvas retires.
 */

export { default } from '../client-v2/canvas/style';
