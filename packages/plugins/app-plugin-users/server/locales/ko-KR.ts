import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} 님이 {{app}}에 초대했습니다',
    intro: '{{inviter}} 님이 {{app}}에 초대했습니다.',
    summary: '다음에도 참여하게 됩니다: {{items}}.',
    separator: ', ',
    action: '초대 수락',
    validity:
      '링크를 열어 이름과 비밀번호를 설정하세요. 링크는 한 번만 사용할 수 있으며 {{date}}까지 유효합니다.',
    fallback: '링크가 열리지 않으면 브라우저에 복사해 붙여 넣으세요:',
  },
};

export default koKR;
