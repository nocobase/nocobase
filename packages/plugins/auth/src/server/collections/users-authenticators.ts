import { CollectionOptions } from '@nocobase/database';

/**
 * Collection for user information of extended authentication methods,
 * such as saml, oicd, oauth, sms, etc.
 */
export default {
  namespace: 'auth.auth',
  duplicator: {
    dumpable: 'optional',
    /**
     * When dump this collection, the users collection is required to be dumped.
     */
    with: 'users',
  },
  name: 'usersAuthenticators',
  title: '{{t("Users Authenticators")}}',
  model: 'UserAuthModel',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    /**
     * uuid:
     * Unique user id of the authentication method, such as wechat openid, phone number, etc.
     */
    {
      name: 'uuid',
      interface: 'input',
      type: 'string',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("UUID")}}',
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
