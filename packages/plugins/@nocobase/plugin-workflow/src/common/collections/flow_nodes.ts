/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  name: 'flow_nodes',
  shared: true,
  fields: [
    {
      type: 'uid',
      name: 'key',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Title")}}',
        'x-component': 'Input',
      },
    },
    // which workflow belongs to
    {
      name: 'workflow',
      type: 'belongsTo',
    },
    {
      name: 'upstream',
      type: 'belongsTo',
      target: 'flow_nodes',
    },
    {
      name: 'branches',
      type: 'hasMany',
      target: 'flow_nodes',
      sourceKey: 'id',
      foreignKey: 'upstreamId',
    },
    // only works when upstream node is branching type, such as condition and parallel.
    // put here because the design of flow-links model is not really necessary for now.
    // or it should be put into flow-links model.
    {
      name: 'branchIndex',
      type: 'integer',
    },
    // Note: for reasons:
    // 1. redirect type node to solve cycle flow.
    // 2. recognize as real next node after branches.
    {
      name: 'downstream',
      type: 'belongsTo',
      target: 'flow_nodes',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'json',
      name: 'config',
      defaultValue: {},
    },
  ],
};
