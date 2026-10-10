import type { UsersResource } from './en-US.js';

const zhCN: UsersResource = {
  invitationEmail: {
    subject: '{{inviter}} 邀请你加入 {{app}}',
    intro: '{{inviter}} 邀请你加入 {{app}}。',
    summary: '你还将加入：{{items}}。',
    separator: '、',
    action: '接受邀请',
    validity: '打开链接设置姓名和密码即可加入，{{date}} 前有效，只能使用一次。',
    fallback: '如果链接无法打开，请复制到浏览器：',
  },
};

export default zhCN;
