/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Check if the application is running in transient mode (WORKER_MODE === '-'),
 * which means it is a short-lived subprocess spawned to execute a command and then exit.
 * @experimental
 */
export function isTransient(): boolean {
  return process.env.WORKER_MODE === '-';
}

/**
 * Check if the application is serving as a specific worker.
 * @experimental
 */
export function serving(key?: string): boolean {
  const { WORKER_MODE = '' } = process.env;
  if (!WORKER_MODE) {
    return true;
  }
  if (WORKER_MODE === '-') {
    return false;
  }
  const topics = WORKER_MODE.trim().split(',');
  if (key) {
    if (WORKER_MODE === '*') {
      return true;
    }
    if (topics.includes(key)) {
      return true;
    }
    return false;
  } else {
    if (topics.includes('!')) {
      return true;
    }
    return false;
  }
}
