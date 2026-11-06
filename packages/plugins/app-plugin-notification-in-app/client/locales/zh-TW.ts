import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: '個人收件匣',
    title: '留言中心',
    unreadCount: '{{count}} 未讀',
    description: '您所使用的應用程式和工作流程的更新。',
    markAllRead: '標記全部已讀',
    messagesTitle: '訊息',
    messagesDescription: '應用程式內訊息為目前使用者保留獨立的讀取狀態。',
    unreadFilter: '未讀',
    unavailable: '收件匣不可用',
    retry: '重試',
    loading: '正在載入通知...',
    emptyTitle: '你們都陷入困境了',
    emptyDescription: '新通知將出現在此。',
    loadingMore: '載入中…',
    loadMore: '載入更多',
    scrollMore: '向下滾動載入更多',
    noMore: '沒有更多訊息',
    expand: '顯示更多',
    collapse: '顯示較少',
    channel: '應用內',
    open: '開啟',
    markUnread: '標記為未讀',
    markRead: '標記已讀',
    delete: '刪除通知',
    errors: {
      update: '收件匣更新失敗。',
      loadMore: '無法載入更多通知。',
      markAllRead: '無法將通知標記為已讀。',
    },
  },
};

export default zhTW;
