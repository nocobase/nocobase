import { CollectionOptions } from '@nocobase/database';

/**
 * Collection for extended authentication methods,
 * such as saml, oicd, oauth, sms, etc.
 */
export default {
  namespace: 'users.users',
  duplicator: 'optional',
  name: 'authenticators',
  title: '{{t("Authenticators")}}',
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
      uiSchema: {
        type: 'number',
        title: '{{t("ID")}}',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
      interface: 'id',
    },
    /**
     * pluginId:
     * ID of the plugin that provides the authentication method.
     */
    {
      name: 'plugin',
      type: 'belongsTo',
      target: 'applicationPlugins',
      targetKey: 'id',
      foreignKey: 'pluginId',
      onDelete: 'CASCADE',
      allowNull: false,
    },
    /**
     * type:
     * Authentication method, such as wechat, phone, saml, oidc, etc.
     */
    {
      interface: 'input',
      type: 'string',
      name: 'type',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Type")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'textarea',
      type: 'string',
      name: 'description',
      allowNull: false,
      defaultValue: '',
      uiSchema: {
        type: 'string',
        title: '{{t("Type")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    /**
     * settings:
     * Define some custom settings for the authentication method.
     * For example:
     * The map of user information fields from the authentication method
     * and the fields of user collection in Nocobase.
     * General format:
     *
     * {
     *   "role": {
     *     "mapping": [{
     *         source: "admin",
     *         target: "Admin",
     *       }
     *     ],
     *     "useDefaultRole": false,
     *     "createIfNotExists": true,
     *   },
     * }
     */
    {
      type: 'json',
      name: 'settings',
      allowNull: false,
      defaultValue: {},
    },
  ],
} as CollectionOptions;
