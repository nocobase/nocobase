/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginCommandError } from './plugin-command-error';

type ErrorLevel = 'fatal' | 'silly' | 'warn';

export function getErrorLevel(e: Error): ErrorLevel {
  // @ts-ignore
  if (e.code === 'commander.unknownCommand') {
    return 'silly';
  }

  if (e instanceof PluginCommandError) {
    return 'warn';
  }

  if (e.name === 'RestoreCheckError') {
    return 'warn';
  }

  return 'fatal';
}
