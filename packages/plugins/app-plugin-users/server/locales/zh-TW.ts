import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} 邀請您來 {{app}}',
    intro: '{{inviter}} 邀請您來到 {{app}}。',
    summary: '您還將加入：{{items}}。',
    separator: ', ',
    action: '接受邀請',
    validity: '開啟連結設定您的姓名和密碼。它工作一次，直到{{date}}。',
    fallback: '如果連結打不開，請將其複製到您的瀏覽器中：',
  },
};

export default zhTW;
