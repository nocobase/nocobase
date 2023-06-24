import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'api-keys',
  duplicator: 'optional',
  name: 'apiKeys',
  title: '{{t("Api keys")}}',
  sortable: 'sort',
  model: 'ApiKeyModel',
  createdBy: true,
  updatedAt: false,
  updatedBy: false,
  logging: true,
  fields: [
    {
      type: 'string',
      name: 'name',
      prefix: 'r_',
      primaryKey: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("name")}}',
        'x-component': 'Input',
      },
    },
    {
      interface: 'obo',
      type: 'belongsTo',
      name: 'role',
      target: 'roles',
      foreignKey: 'roleId',
      sourceKey: 'id',
      targetKey: 'name',
      uiSchema: {
        type: 'object',
        title: '{{t("Roles")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'name',
          },
        },
      },
    },
    {
      name: 'expires',
      type: 'date',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '{{t("Expires")}}',
        'x-component': 'Select',
        'x-component-props': {
          enum: [
            {
              label: '{{t("Never")}}',
              value: 0,
            },
            {
              label: '{{t("1 week"}}',
              value: 24 * 60 * 60 * 1000 * 7,
            },
            {
              label: '{{t("1 month")}}',
              value: 24 * 60 * 60 * 1000 * 30,
            },
            {
              label: '{{t("1 year")}}',
              value: 24 * 60 * 60 * 1000 * 365,
            },
          ],
        },
      },
    },
  ],
} as CollectionOptions;
