/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionOptions, Fields, Filter, Sort } from '@nocobase/database';

export default {
  name: 'aiContextDatasources',
  migrationRules: ['schema-only'],
  fields: [
    {
      name: 'title',
      type: 'string',
      length: 64,
      allowNull: false,
    },
    {
      name: 'description',
      length: 512,
      type: 'string',
      allowNull: false,
    },
    {
      name: 'datasource',
      length: 128,
      type: 'string',
      allowNull: false,
    },
    {
      name: 'collectionName',
      length: 128,
      type: 'string',
      allowNull: false,
    },
    {
      name: 'fields',
      type: 'jsonb',
      allowNull: true,
    },
    {
      name: 'filter',
      type: 'jsonb',
      allowNull: true,
    },
    {
      name: 'sort',
      type: 'jsonb',
      allowNull: true,
    },
    {
      name: 'limit',
      type: 'integer',
      allowNull: false,
      defaultValue: 1000,
    },
    {
      name: 'enabled',
      type: 'boolean',
      allowNull: false,
      defaultValue: true,
    },
  ],
} as CollectionOptions;

export type AIContextDatasource = {
  id: string;
  title: string;
  description: string;
  datasource: string;
  collectionName: string;
  fields?: Fields;
  filter?: Filter;
  sort?: Sort[];
  limit: number;
  enabled: boolean;
};
