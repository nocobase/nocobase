import type { AuthenticationServerResource } from './en-US.js';
const zhCN: AuthenticationServerResource = {
  passwordResetEmail: {
    subject: '重置您的 {{app}} 密码',
    text: '{{name}}，您好：\n重置密码：{{url}}\n如果您未申请重置密码，请忽略此邮件。',
    html: '<p>{{name}}，您好：</p><p><a href="{{url}}">重置密码</a></p><p>如果您未申请重置密码，请忽略此邮件。</p>',
  },
};
export default zhCN;
