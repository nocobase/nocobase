import { CollectionOptions } from '@nocobase/database';

/**
 * Collection for user information of extended authentication methods,
 * such as saml, oicd, oauth, sms, etc.
 */
export default {
  namespace: 'users.users',
  duplicator: {
    dumpable: 'optional',
    /**
     * When dump this collection, the users collection is required to be dumped.
     */
    with: 'users',
  },
  name: 'userAuthInfomation',
  title: '{{t("User Auth Infomation")}}',
  model: 'UserAuthInfoModel',
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
    {
      name: 'user',
      type: 'belongsTo',
      target: 'users',
      targetKey: 'id',
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    },
    /**
     * uuid:
     * Unique user id of the authentication method, such as wechat openid, phone number, etc.
     */
    {
      name: 'uuid',
      interface: 'input',
      type: 'string',
      unique: 'uuid_type_plugin',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("UUID")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    /**
     * type:
     * Authentication method, such as wechat, phone, saml, oidc, etc.
     */
    {
      interface: 'input',
      type: 'string',
      name: 'type',
      unique: 'uuid_type_plugin',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Type")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    /**
     * plugin:
     * Name of the plugin that provides the authentication method.
     */
    {
      interface: 'input',
      type: 'string',
      name: 'plugin',
      unique: 'uuid_type_plugin',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Plugin Name")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'nickname',
      allowNull: false,
      defaultValue: '',
      uiSchema: {
        type: 'string',
        title: '{{t("Nickname")}}',
        'x-component': 'Input',
      },
    },
    {
      interface: 'attachment',
      type: 'string',
      name: 'avatar',
      allowNull: false,
      defaultValue: '',
      uiSchema: {
        type: 'string',
        title: '{{t("Avatar")}}',
        'x-component': 'Upload',
      },
    },
    /**
     * meta:
     * Metadata, some other information of the authentication method.
     */
    {
      type: 'json',
      name: 'meta',
      defaultValue: {},
    },
  ],
} as CollectionOptions;
