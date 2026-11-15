/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class MCPToolPermissionError extends Error {
  constructor(readonly code: 'INVALID_PERMISSION' | 'TOOL_NOT_FOUND_OR_AMBIGUOUS') {
    super(code);
    this.name = 'MCPToolPermissionError';
  }
}
