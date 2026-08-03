/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { jsTemplatePaths, lightExtensionPaths } from './paths';
import { lightExtensionSchemas } from './schemas';
import vscFileSwagger from './vsc-file';

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - JS Templates plugin',
    version: '1.0.0',
  },
  tags: [
    { name: 'jsTemplateRepos', description: 'Discover existing JS Template source repositories.' },
    { name: 'jsTemplateEntries', description: 'Inspect and discover reusable JS Template entries.' },
    { name: 'jsTemplateReferences', description: 'Inspect visible JS Template usage references.' },
    { name: 'jsTemplateFiles', description: 'Read and save JS Template source files.' },
    {
      name: 'jsTemplates',
      description: 'Preview compilation and move source between inline and Entry workspaces.',
    },
    { name: 'lightExtensionRepos', description: 'Legacy alias for JS Template source repositories.' },
    { name: 'lightExtensionEntries', description: 'Legacy alias for reusable JS Template entries.' },
    { name: 'lightExtensionReferences', description: 'Legacy alias for JS Template usage references.' },
    { name: 'lightExtensionFiles', description: 'Legacy alias for JS Template source files.' },
    { name: 'lightExtensions', description: 'Legacy aliases for JS Template compilation and source moves.' },
    ...vscFileSwagger.tags,
  ],
  paths: {
    ...jsTemplatePaths,
    ...lightExtensionPaths,
    ...vscFileSwagger.paths,
  },
  components: {
    schemas: {
      ...lightExtensionSchemas,
      ...vscFileSwagger.components.schemas,
    },
  },
};
