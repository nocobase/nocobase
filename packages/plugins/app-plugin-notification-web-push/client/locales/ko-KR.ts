import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  'push.deviceCount': '등록 {{total}}대 · 활성 {{active}}대',
  'push.active': 'Enabled',
  'push.paused': 'Paused',
  'push.pause': 'Pause',
  'push.resume': 'Resume',
  'push.title': '푸시 알림',
  'push.description': '앱이 닫혀 있어도 각 기기에서 알림을 받습니다.',
  'push.subscribe': '이 기기 구독',
  'push.name': '기기 이름',
  'push.empty': '구독한 기기가 없습니다',
  'push.emptyHint': '앱이 닫혀 있을 때도 알림을 받으려면 이 기기를 구독하세요.',
  'push.ios':
    "iOS 또는 iPadOS 16.4 이상에서는 Safari의 공유 메뉴를 열고 '홈 화면에 추가'를 선택한 뒤, 아이콘으로 앱을 열어 구독하세요.",
  'push.unsupported':
    '푸시를 사용하려면 HTTPS와 Web Push를 지원하는 브라우저가 필요합니다.',
  'push.unavailable':
    '푸시가 설정되지 않았습니다. 관리자에게 VAPID와 비밀 키 설정을 요청하세요.',
  'push.denied':
    '알림이 차단되어 있습니다. 브라우저의 사이트 설정에서 허용한 뒤 다시 시도하세요.',
  'push.current': '이 기기',
  'push.more': '기기 작업',
  'push.test': '테스트 알림 보내기',
  'push.remove': '삭제',
  'push.removeTitle': '기기 “{{name}}”을(를) 삭제할까요?',
  'push.removeHint':
    '이 기기는 더 이상 푸시 알림을 받지 않습니다. 해당 기기에서 다시 구독할 수 있습니다.',
  'push.cancel': '취소',
  'push.saved': '기기 설정이 저장되었습니다',
  'push.saving': '기기 설정을 저장하는 중',
  'push.testSent': '푸시 서비스가 테스트 알림을 수락했습니다.',
  'push.invalid':
    '브라우저가 잘못된 구독 정보를 반환했습니다. 다시 구독해 주세요.',
  'push.endpoint': '서버에서 이 브라우저의 푸시 서비스를 지원하지 않습니다.',
  'push.owned':
    '이 브라우저 구독은 다른 계정에 속해 있습니다. 해당 계정에서 삭제한 후 다시 구독해 주세요.',
  'push.browserFailed':
    '브라우저가 푸시 구독을 만들지 못했습니다. 알림 설정과 인터넷 연결을 확인해 주세요.',
  'push.expired':
    '이 기기의 구독이 만료되었거나 삭제되었습니다. 해당 기기에서 다시 구독해 주세요.',
  'push.testPaused':
    '테스트 알림을 보내기 전에 이 기기의 푸시를 다시 켜 주세요.',
  'push.testLimited': '테스트 알림을 다시 보내려면 30초 동안 기다려 주세요.',
  'push.testNetwork':
    '서버가 푸시 서비스에 연결하지 못했습니다. 관리자에게 네트워크 및 Web Push 프록시 확인을 요청해 주세요.',
  'push.testGatewayAuth':
    '푸시 서비스가 서버 인증 정보를 거부했습니다. 관리자에게 VAPID 키 확인을 요청해 주세요.',
  'push.testGatewayLimited':
    '푸시 서비스가 요청을 제한하고 있습니다. 나중에 다시 시도해 주세요.',
  'push.testGateway':
    '푸시 서비스가 테스트 알림을 수락하지 못했습니다. 나중에 다시 시도해 주세요.',
  'push.failed': '푸시 알림을 업데이트할 수 없습니다. 다시 시도하세요.',
  'push.loadingFailed': '기기를 불러올 수 없습니다. 다시 시도하세요.',
  'push.retry': '다시 시도',
  'channelType.title': '브라우저 푸시',
  'channelType.testHint':
    '푸시를 켠 브라우저로 테스트 알림을 보냅니다. 먼저 개인 설정 › 알림에서 켜세요.',
};

export default koKR;
