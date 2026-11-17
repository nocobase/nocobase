import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} 邀請您加入 {{app}}',
    intro: '{{inviter}} 邀請您加入 {{app}}。',
    summary: '您還將加入：{{items}}。',
    separator: '、',
    action: '接受邀請',
    validity: '開啟連結設定姓名和密碼即可加入，{{date}} 前有效，只能使用一次。',
    fallback: '如果連結打不開，請將其複製到您的瀏覽器中：',
  },
};

export default zhTW;
