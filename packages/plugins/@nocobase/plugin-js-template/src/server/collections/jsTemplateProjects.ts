/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

import { JS_TEMPLATE_COLLECTIONS, JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES } from '../../constants';

export default defineCollection({
  name: JS_TEMPLATE_COLLECTIONS.projects,
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      name: 'jst_project_application_normalized_uq',
      unique: true,
      fields: ['applicationName', 'normalizedName'],
    },
    {
      name: 'jst_project_vsc_uq',
      unique: true,
      fields: ['vscRepoId'],
    },
    {
      name: 'jst_project_health_idx',
      fields: ['lifecycleStatus', 'healthStatus'],
    },
    {
      name: 'jst_project_application_idx',
      fields: ['applicationName'],
    },
    {
      name: 'jst_project_head_idx',
      fields: ['headCommitId'],
    },
    {
      name: 'jst_project_creation_job_uq',
      unique: true,
      fields: ['creationJobId'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'jtp_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'vscRepoId',
      length: 64,
      allowNull: false,
      unique: true,
    },
    {
      type: 'string',
      name: 'applicationName',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'name',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'normalizedName',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'text',
      name: 'description',
    },
    {
      type: 'string',
      name: 'lifecycleStatus',
      allowNull: false,
      defaultValue: 'enabled',
      validate: {
        isIn: [JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES],
      },
    },
    {
      type: 'string',
      name: 'healthStatus',
      allowNull: false,
      defaultValue: 'pending',
    },
    {
      type: 'string',
      name: 'headCommitId',
    },
    {
      type: 'date',
      name: 'lastCompiledAt',
    },
    {
      type: 'string',
      name: 'creationJobId',
      length: 64,
      unique: true,
    },
  ],
});
