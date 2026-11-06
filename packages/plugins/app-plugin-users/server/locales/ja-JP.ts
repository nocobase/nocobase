import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} が {{app}} に招待しました',
    intro: '{{inviter}} があなたを {{app}} に招待しました。',
    summary: 'あなたも参加します: {{items}}。',
    separator: ', ',
    action: '招待を受ける',
    validity:
      'リンクを開いて名前とパスワードを設定します。 {{date}} までは 1 回だけ動作します。',
    fallback: 'リンクが開かない場合は、ブラウザにコピーしてください。',
  },
};

export default jaJP;
