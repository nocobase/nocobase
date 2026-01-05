/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TaskId } from '../../common/types';

export type ConcurrencyMode = 'app' | 'process';

export interface ConcurrencyMonitor {
  idle(): boolean;

  concurrency: number;

  increase(taskId: TaskId): boolean;

  reduce(taskId: TaskId): void;
}
