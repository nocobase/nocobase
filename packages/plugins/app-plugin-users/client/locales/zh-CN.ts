import type { UsersResource } from './en-US.js';

const zhCN: UsersResource = {
  page: {
    loading: '加载中',
  },
  accept: {
    title: '接受邀请',
    description: '{{inviter}} 邀请了你。',
    summary: '你还将加入：{{items}}',
    loading: '正在加载邀请…',
    email: '邮箱',
    name: '姓名',
    password: '密码',
    nameRequired: '请填写姓名。',
    passwordTooShort: '密码至少需要 {{min}} 个字符。',
    submit: '创建账号并加入',
    join: '接受邀请',
    submitting: '正在加入…',
    signedIn: '你当前以 {{name}} 登录。请先退出，再用新账号接受邀请。',
    signOut: '退出登录',
    signOutFailed: '退出登录失败。',
    existingAccount: '这个邮箱已有账号，请用它登录后继续。',
    verifyDescription:
      '创建账号前，请通过发送到此邮箱的专用链接验证身份。仅持有转发的邀请链接无法创建账号。',
    verifyEmail: '发送验证邮件',
    verificationSending: '正在发送验证邮件…',
    verificationSent:
      '请查收邮件并在 15 分钟内打开验证链接。一分钟后可以重新发送。',
    goToLogin: '去登录',
    errors: {
      verificationDelivery: '验证邮件未能发出，请稍后重试或联系管理员。',
      verificationRateLimited: '请等待一分钟后再申请验证邮件。',
      verificationRequired:
        '请打开受邀邮箱中有效的验证链接，或在下方重新申请。',
      notFound: '邀请链接无效。',
      expired: '邀请已过期，请联系邀请人重新发送。',
      accepted: '这个邀请已被接受。',
      revoked: '这个邀请已被撤销。',
      password: '密码不符合要求。',
      accountConflict: '无法用这个邮箱创建账号。',
      failed: '出了点问题，请重试。',
    },
  },
};

export default zhCN;
