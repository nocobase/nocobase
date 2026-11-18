import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
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
  'push.testSent': '테스트 알림이 대기열에 추가되었습니다',
  'push.failed': '푸시 알림을 업데이트할 수 없습니다. 다시 시도하세요.',
  'push.loadingFailed': '기기를 불러올 수 없습니다. 다시 시도하세요.',
  'push.retry': '다시 시도',
};

export default koKR;
