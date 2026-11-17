import type { NotificationResource } from './en-US.js';

const koKR: NotificationResource = {
  logs: {
    deliveryOperations: '발송 작업',
    recipeDescription: '각 채널 전달과 모든 제공자 시도를 추적합니다.',
    redacted: '메시지 본문, 수신자, 임대 토큰은 가려집니다.',
    providerAttempts: '제공자 시도',
    eyebrow: '알림',
    title: '알림 로그',
    description:
      '알림 발송과 모든 제공자 시도를 추적합니다. 메시지 본문, 수신자, 임대 토큰은 가려집니다.',
    refreshing: '새로 고치는 중…',
    retryRead: '다시 시도',
    deliveriesShown: '표시된 발송',
    needAttention: '확인 필요',
    unavailable: '로그를 사용할 수 없음',
    recent: '최근 알림',
    loading: '발송 기록을 불러오는 중…',
    emptyTitle: '아직 발송 기록이 없습니다',
    emptyDescription: '알림을 보내면 발송 기록이 여기에 표시됩니다.',
    expand: '알림 펼치기',
    collapse: '알림 접기',
    noDeliveries: '기록된 발송이 없습니다.',
    noAttempts: '기록된 시도가 없습니다.',
    columns: {
      source: '출처',
      notificationId: '알림 ID',
      status: '상태',
      deliveries: '발송',
      created: '생성됨',
      channel: '채널',
      provider: '제공자',
      attempts: '시도',
      updated: '업데이트됨',
    },
  },
  status: {
    pending: '대기 중',
    processing: '처리 중',
    completed: '완료',
    partial: '일부 완료',
    failed: '실패',
    unknown: '알 수 없음',
    preparing: '준비 중',
    submitting: '제출 중',
    retrying: '재시도 중',
    accepted: '접수됨',
  },
  errors: {
    requestFailed: '알림 요청에 실패했습니다.',
    inAppRecipientNotFound: '앱 내 알림 수신자가 존재하지 않습니다.',
  },
};

const resource: { notificationLogs: NotificationResource } = {
  notificationLogs: koKR,
};
export default resource;
