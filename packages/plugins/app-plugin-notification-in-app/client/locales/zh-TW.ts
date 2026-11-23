import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const zhTW: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: '站內信',
    views: {
      all: '全部',
      unread: '未讀',
      todo: '待處理',
    },
    categories: '類別',
    readAll: '全部標為已讀',
    open: '開啟',
    actions: {
      read: '標為已讀',
      unread: '標為未讀',
      delete: '刪除',
    },
    tabs: {
      today: '今天',
      info: '更早',
      decision: '待處理',
    },
  },
  inboxButton: {
    title: '站內信',
    viewAll: '開啟站內信',
  },
  nav: {
    inbox: '站內信',
  },
};

export default zhTW;
