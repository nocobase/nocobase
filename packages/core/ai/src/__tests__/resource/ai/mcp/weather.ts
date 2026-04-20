/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineMCP } from '../../../../index';

export default defineMCP({
  transport: 'http',
  url: 'http://localhost:8123/mcp',
  headers: {
    Authorization: 'Bearer test-token',
  },
  env: {
    MCP_ENV: 'test',
  },
  args: ['--foo'],
  restart: {
    enabled: true,
  },
});
