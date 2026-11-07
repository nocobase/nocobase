import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  channels: {
    inApp: '앱 내',
  },
  providers: {
    builtIn: '기본 제공',
  },
  errors: {
    authenticationRequired: '로그인이 필요합니다.',
    invalidPageToken: 'pageToken이 이 목록에서 반환한 토큰이 아닙니다.',
    notFound: '알림 메시지를 찾을 수 없습니다.',
  },
};

export default koKR;
