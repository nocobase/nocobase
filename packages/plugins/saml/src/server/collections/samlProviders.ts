import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'samlProviders',
  title: '{{t("SAML Providers")}}',
  fields: [
    {
      comment: '标题',
      type: 'string',
      name: 'title',
    },
    {
      comment: '客户端id',
      type: 'string',
      name: 'clientId',
    },
    {
      comment: '唯一标识(entityId/Issuer)',
      type: 'string',
      name: 'issuer',
    },
    {
      comment: '登录地址(ACS)',
      type: 'string',
      name: 'loginUrl',
    },
    {
      comment: '公钥',
      type: 'text',
      name: 'certificate',
    },
    {
      comment: '重定向地址',
      type: 'text',
      name: 'redirectUrl',
    },
    {
      comment: '启用',
      type: 'boolean',
      name: 'enabled',
    },
  ],
} as CollectionOptions;
