import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const jaJP: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: '受信箱',
    views: {
      all: 'すべて',
      unread: '未読',
      todo: '対応待ち',
    },
    categories: 'カテゴリ',
    readAll: 'すべて既読にする',
    open: '開く',
    actions: {
      read: '既読にする',
      unread: '未読にする',
      delete: '削除',
    },
    tabs: {
      today: '今日',
      info: 'それ以前',
      decision: '対応待ち',
    },
  },
  inboxButton: {
    title: '受信箱',
    viewAll: '受信箱を開く',
  },
  nav: {
    inbox: '受信箱',
  },
};

export default jaJP;
