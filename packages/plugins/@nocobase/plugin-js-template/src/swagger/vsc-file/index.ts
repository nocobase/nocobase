/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { rawVscFilePaths, runJSSourcePaths } from './paths';
import { runJSSourceSchemas } from './schemas';

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - VSC file plugin',
    version: '1.0.0',
  },
  tags: [
    {
      name: 'runJSSources',
      description: 'Open, preview, and save owner-aware RunJS Studio workspaces.',
    },
    {
      name: 'vscFile',
      description:
        'Raw VSC compatibility actions for generic repositories. Protected RunJS and js-template owners remain permission-gated.',
    },
  ],
  paths: {
    ...runJSSourcePaths,
    ...rawVscFilePaths,
  },
  components: {
    schemas: runJSSourceSchemas,
  },
};
