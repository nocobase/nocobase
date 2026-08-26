/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ToolsEntry } from './tools-manager';

export const toToolsMap = (tools: ToolsEntry[]) => new Map(tools.map((t) => [t.definition.name, t]));
