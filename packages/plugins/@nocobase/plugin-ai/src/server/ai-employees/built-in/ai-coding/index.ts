/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import profile from './profile';

export default {
  username: 'nathan',
  description: 'AI employee for coding',
  profile,
  skillSettings: {
    skills: [
      {
        name: 'getDataSources',
        autoCall: true,
      },
      {
        name: 'getCollectionNames',
        autoCall: true,
      },
      {
        name: 'getCollectionMetadata',
        autoCall: true,
      },
      {
        name: 'listCodeSnippet',
        autoCall: true,
      },
      {
        name: 'getCodeSnippet',
        autoCall: true,
      },
      {
        name: 'getContextApis',
        autoCall: true,
      },
      {
        name: 'getContextEnvs',
        autoCall: true,
      },
      {
        name: 'getContextVars',
        autoCall: true,
      },
      {
        name: 'lintAndTestJS',
        autoCall: true,
      },
      {
        name: 'searchFieldMetadata',
        autoCall: true,
      },
      {
        name: 'searchDocs',
        autoCall: true,
      },
      {
        name: 'readDocEntry',
        autoCall: true,
      },
    ],
  },
};
