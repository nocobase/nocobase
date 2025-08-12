/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'asyncTasks',
  autoGenId: false,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'origin',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'jsonb',
      name: 'params',
    },
    {
      type: 'integer',
      name: 'status',
    },
    {
      type: 'jsonb',
      name: 'result',
    },
    {
      type: 'integer',
      name: 'createdById',
    },
    {
      type: 'boolean',
      name: 'cancelable',
    },
    {
      type: 'double',
      name: 'progressTotal',
    },
    {
      type: 'double',
      name: 'progressCurrent',
    },
    {
      type: 'date',
      name: 'createdAt',
    },
    {
      type: 'date',
      name: 'startedAt',
    },
    {
      type: 'date',
      name: 'doneAt',
    },
  ],
};
