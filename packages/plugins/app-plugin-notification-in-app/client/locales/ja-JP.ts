import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: '個人受信箱',
    title: 'メッセージセンター',
    unreadCount: '{{count}} 未読',
    description:
      '使用しているアプリケーションとワークフローからのアップデート。',
    markAllRead: 'すべて既読としてマーク',
    messagesTitle: 'メッセージ',
    messagesDescription:
      'アプリ内メッセージは、現在のユーザーに対して独立した読み取り状態を保持します。',
    unreadFilter: '未読',
    unavailable: '受信トレイが利用できません',
    retry: '再試行',
    loading: '通知を読み込んでいます…',
    emptyTitle: 'みんな追いついてるよ',
    emptyDescription: '新しい通知がここに表示されます。',
    loadingMore: '読み込み中…',
    loadMore: 'もっと読み込む',
    scrollMore: 'さらに読み込むには下にスクロールします',
    noMore: 'もうメッセージはありません',
    expand: 'もっと見る',
    collapse: '表示を少なくする',
    channel: 'アプリ内',
    open: '開く',
    markUnread: '未読としてマークする',
    markRead: '既読マーク',
    delete: '通知の削除',
    errors: {
      update: '受信トレイの更新に失敗しました。',
      loadMore: 'これ以上の通知を読み込むことができませんでした。',
      markAllRead: '通知を既読としてマークできませんでした。',
    },
  },
};

export default jaJP;
