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
  username: 'flowmind',
  description: 'Workflow automation architect',
  profile,
  skillSettings: {
    skills: [
      { name: 'workflowDesigner-workflowUpsert', autoCall: true },
      { name: 'workflowDesigner-workflowNodeUpsert', autoCall: true },
      { name: 'searchDocs', autoCall: true },
      { name: 'readDocEntry', autoCall: true },
      { name: 'dataModeling-getCollectionNames', autoCall: true },
      { name: 'dataModeling-getCollectionMetadata', autoCall: true },
      { name: 'dataSource-dataSourceQuery', autoCall: true },
      { name: 'dataSource-dataSourceCounting', autoCall: true },
    ],
  },
};
