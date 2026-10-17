import type { MailServerResource } from './en-US.js';

const zhCN: MailServerResource = {
  errors: {
    imapMoveLocationChanged:
      '所选文件夹或副本已变化，请同步邮箱后重新打开来源文件夹。',
    imapMoveNotWritable: '所选文件夹不允许此操作，请检查邮箱权限。',
    imapMoveSourceRequired: '请打开来源文件夹后再移动或删除这封邮件。',
    imapMoveUnsupported: '此邮箱不支持安全移动，请到邮箱客户端中操作。',
    imapTrashNotFound: '此邮箱没有垃圾箱文件夹，请到邮箱客户端中操作。',
    imapMoveOutcomeUnknown:
      '移动未完成或结果未知，请先核对远端邮箱，勿盲目重试。',

    accessDenied: '需要邮件访问权限。',
    idempotencyConflict: '该幂等键已关联到另一个请求。',
    invalidRequest: '邮件请求无效。',
    accountCredentialsInvalid:
      '邮箱认证失败。请检查登录名和密码或授权码，并确认已开启 IMAP/SMTP。Gmail 等邮箱可能需要使用应用专用密码。',
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
