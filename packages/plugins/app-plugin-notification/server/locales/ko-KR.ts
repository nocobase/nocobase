import type { NotificationServerResource } from './en-US.js';

const koKR: NotificationServerResource = {
  errors: {
    logNotFound: '알림 로그를 찾을 수 없습니다.',
    kindNotFound: '알림 유형을 찾을 수 없습니다.',
    channelNotFound: '"{{name}}"(이)라는 사용 중인 알림 채널이 없습니다.',
    channelTestUnsupported:
      '"{{name}}" 채널은 테스트 메시지를 보낼 수 없습니다.',
    channelNoRecipient: '"{{name}}" 채널에 내 주소나 기기가 없습니다.',
    deliveryNotFound: '전송 기록을 찾을 수 없습니다.',
    deliveryNotRetryable:
      '이 전송은 다시 시도할 수 없습니다. 채널이 바뀌지 않은 실패한 전송만 다시 시도할 수 있습니다.',
    retryReasonRequired: '다시 시도하는 이유를 입력하세요.',
    preferenceUnknown: '이 알림에는 해당 채널이 없습니다.',
    preferenceRequired: '이 알림은 항상 이 채널로 보내지며 끌 수 없습니다.',
  },
  test: {
    title: '테스트 알림',
    body: '설정 › 알림에서 "{{channel}}" 채널로 보낸 테스트입니다.',
  },
  authorization: {
    section: '메시지',
    title: '알림',
    read: '보기',
    manage: '관리',
  },
};

export default koKR;
