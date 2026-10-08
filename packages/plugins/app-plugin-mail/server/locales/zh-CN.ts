import type { MailServerResource } from './en-US.js';

const zhCN: MailServerResource = {
  errors: {
    accessDenied: '需要邮件访问权限。',
    idempotencyConflict: '该幂等键已关联到另一个请求。',
    invalidRequest: '邮件请求无效。',
    requestFailed: '无法完成邮件请求。',
    providerRateLimited: '邮件服务请求过于频繁，请稍后重试。',
    providerUnavailable: '无法连接邮件服务，请稍后重试。',
    reauthorizationRequired: '需要重新连接此邮件账户后才能继续使用。',
    syncRunNotFound: '未找到邮件同步任务。',
    messageNotFound: '未找到邮件。',
    authorizationStateRequired: '必须提供邮件授权状态。',
  },
};

export default zhCN;
