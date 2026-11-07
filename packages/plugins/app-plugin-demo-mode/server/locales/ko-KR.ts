import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  authorization: {
    title: '데모 데이터',
    read: '보기',
    manage: '생성 및 삭제',
    configuration: '데모 설정',
    configure: '설정',
  },
  errors: {
    readOnly: '데모 환경입니다. 변경 사항은 저장되지 않습니다.',
  },
};

export default koKR;
