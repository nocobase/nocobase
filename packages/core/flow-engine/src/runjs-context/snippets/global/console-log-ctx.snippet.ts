/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  contexts: ['*'],
  prefix: 'sn-log-ctx',
  label: '打印上下文',
  description: 'Log the whole ctx object to console',
  content: `
console.log('ctx =>', ctx);
ctx.message?.success?.(ctx.t('ctx printed'));
`,
};
