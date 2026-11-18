import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} が {{app}} に招待しました',
    intro: '{{inviter}} があなたを {{app}} に招待しました。',
    summary: 'あなたも参加します: {{items}}。',
    separator: '、',
    action: '招待を受ける',
    validity:
      'リンクを開いて名前とパスワードを設定してください。{{date}} まで有効で、1 回のみ使用できます。',
    fallback: 'リンクが開かない場合は、ブラウザにコピーしてください。',
  },
};

export default jaJP;
