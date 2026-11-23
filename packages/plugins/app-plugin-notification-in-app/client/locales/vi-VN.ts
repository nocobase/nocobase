import type { PartialLocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

/** The inbox's main words; the rest falls back to English. */
const viVN: PartialLocaleResource<typeof enUS> = {
  inbox: {
    title: 'Hộp thư',
    views: {
      all: 'Tất cả',
      unread: 'Chưa đọc',
      todo: 'Đang chờ',
    },
    categories: 'Danh mục',
    readAll: 'Đánh dấu tất cả đã đọc',
    open: 'Mở',
    actions: {
      read: 'Đánh dấu đã đọc',
      unread: 'Đánh dấu chưa đọc',
      delete: 'Xóa',
    },
    tabs: {
      today: 'Hôm nay',
      info: 'Trước đó',
      decision: 'Đang chờ',
    },
  },
  inboxButton: {
    title: 'Hộp thư',
    viewAll: 'Mở hộp thư',
  },
  nav: {
    inbox: 'Hộp thư',
  },
};

export default viVN;
