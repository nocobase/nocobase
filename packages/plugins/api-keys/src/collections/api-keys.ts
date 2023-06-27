import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'api-keys',
  duplicator: 'optional',
  name: 'apiKeys',
  title: '{{t("API Keys")}}',
  sortable: 'sort',
  model: 'ApiKeyModel',
  createdBy: true,
  updatedAt: false,
  updatedBy: false,
  logging: true,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
      interface: 'id',
    },
    {
      type: 'string',
      name: 'name',
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
      foreignKey: 'roleName',
      uiSchema: {
        type: 'object',
        title: '{{t("Roles")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'name',
          },
          service: {
            params: {
              filter: {
                $and: [
                  {
                    users: { id: { $eq: '{{$user.id}}' } },
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      name: 'expiresIn',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '{{t("Expires")}}',
        'x-component': 'Select',
        enum: [
          {
            label: '{{t("1 day")}}',
            value: '1d',
          },
          {
            label: '{{t("7 days")}}',
            value: '7d',
          },
          {
            label: '{{t("30 days")}}',
            value: '30d',
          },
          {
            label: '{{t("90 days")}}',
            value: '90d',
          },
        ],
      },
    },
  ],
} as CollectionOptions;
