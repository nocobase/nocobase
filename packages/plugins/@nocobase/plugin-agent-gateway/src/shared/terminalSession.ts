/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const MANAGED_TMUX_SESSION_PATTERN = /^ag-run-[a-z0-9-]{1,80}$/i;

export function isManagedTmuxSessionName(sessionName: string) {
  return MANAGED_TMUX_SESSION_PATTERN.test(sessionName);
}
