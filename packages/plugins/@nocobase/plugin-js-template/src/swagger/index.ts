/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import runJSWorkspaceSwagger from '@nocobase/runjs/workspace/swagger';
import { jsTemplatePaths } from './paths';
import { jsTemplateSchemas } from './schemas';
import runJSSourcesSwagger from './runjs-sources';

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - JS Templates plugin',
    version: '1.0.0',
  },
  tags: [
    { name: 'jsTemplateProjects', description: 'Discover existing Source Projects.' },
    { name: 'jsTemplateCreateJobs', description: 'Inspect and dismiss Source Project creation jobs.' },
    { name: 'jsTemplates', description: 'Inspect, compile, save, detach, and delete reusable JS Templates.' },
    { name: 'jsTemplateUsages', description: 'Inspect paginated visible usage locations for one JS Template.' },
    { name: 'jsTemplateFiles', description: 'Read and save JS Template source files.' },
    ...runJSSourcesSwagger.tags,
  ],
  paths: {
    ...jsTemplatePaths,
    ...runJSSourcesSwagger.paths,
    ...runJSWorkspaceSwagger.paths,
  },
  components: {
    schemas: {
      ...jsTemplateSchemas,
      ...runJSSourcesSwagger.components.schemas,
      ...runJSWorkspaceSwagger.components.schemas,
    },
  },
};
