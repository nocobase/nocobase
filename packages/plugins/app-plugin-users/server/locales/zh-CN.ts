import type { UsersResource } from './en-US.js';

const zhCN: UsersResource = {
  invitationEmail: {
    subject: '{{inviter}} 邀请你加入 {{app}}',
    intro: '{{inviter}} 邀请你加入 {{app}}。',
    summary: '你还将加入：{{items}}。',
    separator: '、',
    action: '接受邀请',
    validity:
      '请在 15 分钟内验证邮箱并接受邀请。如果验证链接已过期，可在邀请页面重新申请验证邮件。',
    fallback: '如果链接无法打开，请复制到浏览器：',
  },
};

export default zhCN;
