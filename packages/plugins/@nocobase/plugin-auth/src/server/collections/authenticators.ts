import { defineCollection } from '@nocobase/database';

/**
 * Collection for extended authentication methods,
 */
export default defineCollection({
  dumpRules: {
    group: 'third-party',
  },
  shared: true,
  name: 'authenticators',
  sortable: true,
  model: 'AuthModel',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      interface: 'id',
    },
    {
      interface: 'input',
      type: 'string',
      name: 'name',
      allowNull: false,
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Name")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'authType',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Auth Type")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'title',
      uiSchema: {
        type: 'string',
        title: '{{t("Title")}}',
        'x-component': 'Input',
      },
      translation: true,
    },
    {
      interface: 'textarea',
      type: 'string',
      name: 'description',
      allowNull: false,
      defaultValue: '',
      uiSchema: {
        type: 'string',
        title: '{{t("Description")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'json',
      name: 'options',
      allowNull: false,
      defaultValue: {},
    },
    {
      type: 'boolean',
      name: 'enabled',
      defaultValue: false,
    },
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'users',
      target: 'users',
      foreignKey: 'authenticator',
      otherKey: 'userId',
      onDelete: 'CASCADE',
      sourceKey: 'name',
      targetKey: 'id',
      through: 'usersAuthenticators',
    },
  ],
});
