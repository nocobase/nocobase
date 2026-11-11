import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  inbox: {
    eyebrow: '개인 받은편지함',
    title: '메시지 센터',
    unreadCount: '읽지 않음 {{count}}개',
    description: '사용하는 애플리케이션과 워크플로의 업데이트입니다.',
    markAllRead: '모두 읽음으로 표시',
    messagesTitle: '메시지',
    messagesDescription:
      '앱 내 메시지는 현재 사용자별로 읽음 상태를 따로 유지합니다.',
    unreadFilter: '읽지 않음',
    unavailable: '받은편지함을 사용할 수 없음',
    retry: '다시 시도',
    loading: '알림을 불러오는 중…',
    emptyTitle: '모두 확인했습니다',
    emptyDescription: '새 알림이 여기에 표시됩니다.',
    loadingMore: '불러오는 중…',
    loadMore: '더 보기',
    scrollMore: '아래로 스크롤해 더 불러오기',
    noMore: '더 이상 메시지가 없습니다',
    expand: '더 보기',
    collapse: '접기',
    channel: '앱 내',
    open: '열기',
    markUnread: '읽지 않음으로 표시',
    markRead: '읽음으로 표시',
    delete: '알림 삭제',
    errors: {
      update: '받은편지함을 업데이트하지 못했습니다.',
      loadMore: '알림을 더 불러올 수 없습니다.',
      markAllRead: '알림을 읽음으로 표시할 수 없습니다.',
    },
  },
};

export default koKR;
