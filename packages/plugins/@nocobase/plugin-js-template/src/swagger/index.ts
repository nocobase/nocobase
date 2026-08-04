/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { jsTemplatePaths } from './paths';
import { jsTemplateSchemas } from './schemas';
import vscFileSwagger from './vsc-file';

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - JS Templates plugin',
    version: '1.0.0',
  },
  tags: [
    { name: 'jsTemplateProjects', description: 'Discover existing JS Template projects.' },
    { name: 'jsTemplates', description: 'Inspect, compile, and move reusable JS Templates.' },
    { name: 'jsTemplateUsages', description: 'Inspect visible JS Template usages.' },
    { name: 'jsTemplateFiles', description: 'Read and save JS Template source files.' },
    ...vscFileSwagger.tags,
  ],
  paths: {
    ...jsTemplatePaths,
    ...vscFileSwagger.paths,
  },
  components: {
    schemas: {
      ...jsTemplateSchemas,
      ...vscFileSwagger.components.schemas,
    },
  },
};
