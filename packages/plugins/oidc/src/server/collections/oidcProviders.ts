import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'oidcProviders',
  title: 'OIDC Providers',
  fields: [
    {
      title: 'Provider 名称',
      comment: 'Provider 名称',
      type: 'string',
      name: 'providerName',
    },
    {
      comment: '客户端id',
      type: 'string',
      name: 'clientId',
      unique: true,
    },
    {
      comment: '客户端密钥',
      type: 'string',
      name: 'clientSecret',
    },
    {
      title: 'issuer',
      comment: '用于标识 token 发放来源的字段',
      type: 'string',
      name: 'issuer',
    },
    {
      comment: '用于获取当前 Provider 支持的各端点信息和支持的模式、参数信息，可公开访问',
      type: 'string',
      name: 'openidConfiguration',
    },
    {
      comment: '单点登录的地址 ',
      type: 'string',
      name: 'authorizeUrl',
    },
    {
      comment: '获取取 token 的接口地址',
      type: 'string',
      name: 'tokenUrl',
    },
    {
      comment: '令牌吊销 token 的接口',
      type: 'string',
      name: 'revodeUrl',
    },
    {
      comment: '验证 id_token 的接口',
      type: 'string',
      name: 'jwksUrl',
    },
    {
      comment: '获取用户信息的接口',
      type: 'string',
      name: 'userinfoUrl',
    },
    {
      comment: '是否启用',
      type: 'boolean',
      name: 'enable',
    },
    {
      comment: '重定向回调地址',
      type: 'string',
      name: 'redirectUrl',
    },
    {
      comment: '登出端点',
      type: 'string',
      name: 'logoutUrl',
    },
    {
      comment: '获取用户信息的接口',
      type: 'json',
      name: 'attrsMap',
    },
  ],
} as CollectionOptions;
