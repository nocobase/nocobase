import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} mời bạn đến với {{app}}',
    intro: '{{inviter}} đã mời bạn đến với {{app}}.',
    summary: 'Bạn cũng sẽ tham gia: {{items}}.',
    separator: ', ',
    action: 'Chấp nhận lời mời',
    validity:
      'Mở link để đặt tên và mật khẩu. Nó hoạt động một lần, cho đến {{date}}.',
    fallback: 'Nếu link không mở được thì copy vào trình duyệt:',
  },
};

export default viVN;
