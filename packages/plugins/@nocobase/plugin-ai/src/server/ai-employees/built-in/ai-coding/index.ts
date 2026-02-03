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
        name: 'dataModeling-searchFieldMetadata',
        autoCall: true,
      },
      {
        name: 'dataModeling-getDataSources',
        autoCall: true,
      },
      {
        name: 'dataModeling-getCollectionNames',
        autoCall: true,
      },
      {
        name: 'dataModeling-getCollectionMetadata',
        autoCall: true,
      },
      {
        name: 'docs-searchDocs',
        autoCall: true,
      },
      {
        name: 'docs-readDocEntry',
        autoCall: true,
      },
      {
        name: 'codeEditor-getContextApis',
        autoCall: true,
      },
      {
        name: 'codeEditor-getContextEnvs',
        autoCall: true,
      },
      {
        name: 'codeEditor-getContextVars',
        autoCall: true,
      },
      {
        name: 'codeEditor-lintAndTestJS',
        autoCall: true,
      },
      {
        name: 'dataModeling-suggestions',
        autoCall: false,
      },
    ],
  },
};
