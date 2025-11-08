/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export * from './EditTable';
export * from './EditTableAction';
export * from './hooks/useColumnSettings';
export * from './hooks/useTableColumnIntegration';

// Setup EditTable.Action similar to Filter.Action
import { EditTable } from './EditTable';
import { EditTableAction } from './EditTableAction';

EditTable.Action = EditTableAction;
