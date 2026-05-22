/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { BackupManager } from './managers/backup';
export type { BackupSettings, BackupTaskResult } from './managers/backup';
export { RestoreManager } from './managers/restore';
export { BACKUP_EXTENSION } from './utils';
export { default } from './plugin';
