/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';

export default defineCollection({
  name: JS_TEMPLATE_COLLECTIONS.usages,
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [
    {
      name: 'jst_usage_owner_uq',
      unique: true,
      fields: ['ownerLocatorHash', 'projectId', 'templateId'],
    },
    {
      name: 'jst_usage_status_idx',
      fields: ['projectId', 'templateId', 'resolvedStatus'],
    },
    {
      name: 'jst_usage_owner_kind_idx',
      fields: ['ownerKind'],
    },
    {
      name: 'jst_usage_kind_status_idx',
      fields: ['kind', 'resolvedStatus'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'id',
      prefix: 'jtu_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'projectId',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'templateId',
      length: 64,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'kind',
      allowNull: false,
      defaultValue: 'js-block',
    },
    {
      type: 'string',
      name: 'ownerKind',
      allowNull: false,
      defaultValue: 'flowModel.step',
    },
    {
      type: 'json',
      name: 'ownerLocator',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'ownerLocatorHash',
      length: 128,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'settingsHash',
      allowNull: false,
      defaultValue: 'sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a',
    },
    {
      type: 'string',
      name: 'resolvedStatus',
      allowNull: false,
      defaultValue: 'runtime_missing',
    },
    {
      type: 'belongsTo',
      name: 'project',
      target: JS_TEMPLATE_COLLECTIONS.projects,
      targetKey: 'id',
      foreignKey: 'projectId',
      constraints: true,
      onDelete: 'RESTRICT',
    },
    {
      type: 'belongsTo',
      name: 'template',
      target: JS_TEMPLATE_COLLECTIONS.templates,
      targetKey: 'id',
      foreignKey: 'templateId',
      constraints: false,
    },
  ],
});
