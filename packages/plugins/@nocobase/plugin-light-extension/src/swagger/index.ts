/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lightExtensionPaths } from './paths';
import { lightExtensionSchemas } from './schemas';

export default {
  openapi: '3.0.2',
  'x-mcp': false,
  info: {
    title: 'NocoBase API - Light extension plugin',
    version: '1.0.0',
  },
  tags: [
    { name: 'lightExtensionRepos', description: 'Discover existing light-extension source repositories.' },
    { name: 'lightExtensionEntries', description: 'Inspect persisted light-extension entries.' },
    { name: 'lightExtensionReferences', description: 'Inspect visible light-extension usage references.' },
    { name: 'lightExtensionContexts', description: 'Inspect ACL-filtered binding-aware authoring context.' },
    { name: 'lightExtensionFiles', description: 'Read and save light-extension source files.' },
    { name: 'lightExtensions', description: 'Preview light-extension source compilation.' },
    {
      name: 'lightExtensionPreviewProblems',
      description: 'Exchange short-lived preview problems through a user- and role-scoped cursor channel.',
    },
  ],
  paths: lightExtensionPaths,
  components: {
    schemas: lightExtensionSchemas,
  },
};
