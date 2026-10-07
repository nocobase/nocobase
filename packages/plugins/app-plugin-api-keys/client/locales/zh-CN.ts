import type { ApiKeysResource } from './en-US.js';

const zhCN: ApiKeysResource = {
  'common.close': '关闭',
  nav: { apiKeys: 'API 密钥' },
  page: {
    loading: '加载中',
    title: 'API 密钥',
    description: '创建密钥，让脚本和第三方集成以你的身份调用本应用。',
    add: '创建密钥',
    empty: '你还没有创建 API 密钥。',
    unnamed: '未命名密钥',
    never: '永不过期',
    unused: '从未使用',
    active: '有效',
    expired: '已过期',
    disabled: '已停用',
    columns: {
      name: '名称',
      key: '密钥',
      status: '状态',
      lastUsed: '最近使用',
      expires: '过期时间',
      actions: '操作',
    },
    actions: { revoke: '吊销密钥' },
  },
  form: {
    title: '创建 API 密钥',
    description: '密钥以你的身份调用接口，拥有的权限与你的账号完全一致。',
    name: '名称',
    namePlaceholder: '每晚导出任务',
    expiry: '过期时间',
    expiryChoices: {
      never: '永不过期',
      '7': '7 天后',
      '30': '30 天后',
      '90': '90 天后',
      '365': '1 年后',
    },
    cancel: '取消',
    create: '创建密钥',
  },
  reveal: {
    title: '请立即复制密钥',
    description: '“{{name}}”已创建。密钥只会显示这一次。',
    usage: '请通过 x-api-key 请求头发送。',
    copy: '复制密钥',
    done: '完成',
  },
  revoke: {
    title: '吊销密钥“{{name}}”？',
    description: '使用“{{name}}”的请求将立即失败，且无法恢复。',
    cancel: '取消',
    confirm: '吊销密钥',
  },
  errors: {
    loadFailed: '无法加载你的 API 密钥。',
    createFailed: '无法创建 API 密钥。',
    revokeFailed: '无法吊销 API 密钥。',
  },
};

export default zhCN;
