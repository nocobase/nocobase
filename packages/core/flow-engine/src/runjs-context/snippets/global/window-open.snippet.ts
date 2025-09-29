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
  prefix: 'sn-window-open',
  label: 'Open new window',
  description: 'Safely open a new browser window/tab',
  content: `
// Open a new window/tab
window.open('https://example.com', '_blank');
`,
};
