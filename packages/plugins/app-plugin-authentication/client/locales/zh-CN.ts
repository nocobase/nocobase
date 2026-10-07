import type { AuthenticationResource } from './en-US.js';

const zhCN: AuthenticationResource = {
  errors: {
    generic: '出了点问题，请重试。',
    network: '无法连接服务器，请检查网络后重试。',
    rateLimited: '尝试次数过多，请稍后再试。',
    INVALID_EMAIL_OR_PASSWORD: '邮箱或密码不正确。',
    INVALID_USERNAME_OR_PASSWORD: '用户名或密码不正确。',
    INVALID_PASSWORD: '密码不正确。',
    INVALID_EMAIL: '请输入有效的邮箱地址。',
    INVALID_USERNAME: '用户名只能包含字母、数字、下划线和点。',
    USERNAME_TOO_SHORT: '用户名太短。',
    USERNAME_TOO_LONG: '用户名太长。',
    USERNAME_IS_ALREADY_TAKEN: '这个用户名已被占用。',
    USER_ALREADY_EXISTS: '这个邮箱已经注册过账号。',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      '这个邮箱已经注册过账号，请换一个邮箱。',
    PASSWORD_TOO_SHORT: '密码太短。',
    PASSWORD_TOO_LONG: '密码太长。',
    EMAIL_NOT_VERIFIED: '请先验证邮箱再登录。',
    INVALID_TOKEN: '链接无效或已过期。',
    TOKEN_EXPIRED: '链接已过期。',
    ACCOUNT_DISABLED: '该账号已停用，请联系管理员。',
    SERVICE_ACCOUNT_NO_LOGIN: '服务账号不能登录，只能通过 API 密钥操作。',
    INVALID_CSRF_ORIGIN: '请求来自其他站点，已被拒绝。请刷新页面后重试。',
  },
};

export default zhCN;
