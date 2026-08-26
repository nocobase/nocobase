/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import appPaths from './app';
import base from './base';
import collections from './collections';
import pmPaths, { pmComponents } from './pm';

export default {
  ...base,
  tags: [
    ...base.tags.slice(0, 5),
    {
      name: 'app',
      description: 'Application lifecycle and runtime metadata.',
    },
    {
      name: 'pm',
      description: 'Plugin manager operations.',
    },
  ],
  components: {
    ...base.components,
    schemas: {
      ...pmComponents.schemas,
    },
  },
  paths: {
    ...collections,
    ...appPaths,
    ...pmPaths,
  },
};
