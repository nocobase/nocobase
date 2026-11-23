import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const koKR: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: '받은편지함',
    views: {
      all: '전체',
      unread: '읽지 않음',
      todo: '처리 대기',
    },
    categories: '카테고리',
    readAll: '모두 읽음으로 표시',
    open: '열기',
    actions: {
      read: '읽음으로 표시',
      unread: '읽지 않음으로 표시',
      delete: '삭제',
    },
    tabs: {
      today: '오늘',
      info: '이전',
      decision: '처리 대기',
    },
  },
  inboxButton: {
    title: '받은편지함',
    viewAll: '받은편지함 열기',
  },
  nav: {
    inbox: '받은편지함',
  },
};

export default koKR;
