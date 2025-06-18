/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export async function measureExecutionTime(operation, operationName) {
  const startTime = Date.now();
  const result = await operation();
  const endTime = Date.now();
  const duration = (endTime - startTime).toFixed(0);
  console.log(`${operationName} completed in ${duration} milliseconds`);
  return result;
}
