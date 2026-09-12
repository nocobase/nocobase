/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { employeePaths } from './employees';
import { llmPaths } from './llm';
import { schemas } from './schemas';

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - AI plugin',
    version: '1.0.0',
  },
  tags: [
    {
      name: 'ai',
      description: 'Discover and test LLM providers and models.',
    },
    {
      name: 'llmServices',
      description: 'Manage saved LLM service configurations.',
    },
    {
      name: 'aiEmployees',
      description: 'Manage AI employees.',
    },
  ],
  paths: {
    ...llmPaths,
    ...employeePaths,
  },
  components: {
    schemas,
  },
};
