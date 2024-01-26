import { CollectionOptions } from '@nocobase/database';

export default function () {
  return {
    dumpRules: 'required',
    name: 'workflows',
    shared: true,
    fields: [
      {
        name: 'key',
        type: 'uid',
      },
      {
        type: 'string',
        name: 'title',
        required: true,
      },
      {
        type: 'boolean',
        name: 'enabled',
        defaultValue: false,
      },
      {
        type: 'text',
        name: 'description',
      },
      {
        type: 'string',
        name: 'type',
        required: true,
      },
      {
        type: 'string',
        name: 'triggerTitle',
      },
      {
        type: 'jsonb',
        name: 'config',
        required: true,
        defaultValue: {},
      },
      {
        type: 'hasMany',
        name: 'nodes',
        target: 'flow_nodes',
        onDelete: 'CASCADE',
      },
      {
        type: 'hasMany',
        name: 'executions',
        onDelete: 'CASCADE',
      },
      {
        type: 'integer',
        name: 'executed',
        defaultValue: 0,
      },
      {
        type: 'integer',
        name: 'allExecuted',
        defaultValue: 0,
      },
      {
        type: 'boolean',
        name: 'current',
        defaultValue: false,
      },
      {
        type: 'boolean',
        name: 'sync',
        defaultValue: false,
      },
      {
        type: 'hasMany',
        name: 'revisions',
        target: 'workflows',
        foreignKey: 'key',
        sourceKey: 'key',
        // NOTE: no constraints needed here because tricky self-referencing
        constraints: false,
        onDelete: 'NO ACTION',
      },
      {
        type: 'jsonb',
        name: 'options',
        defaultValue: {},
      },
    ],
    // NOTE: use unique index for avoiding deadlock in mysql when setCurrent
    indexes: [
      {
        unique: true,
        fields: ['key', 'current'],
      },
    ],
  } as CollectionOptions;
}
