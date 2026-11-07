import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: '알림 로그에 대한 접근 권한이 필요합니다.',
    logNotFound: '알림 로그를 찾을 수 없습니다.',
  },
};

export default koKR;
