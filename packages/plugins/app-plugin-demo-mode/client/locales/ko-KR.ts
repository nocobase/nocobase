import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  authorization: {
    title: '데모 데이터',
    read: '보기',
    manage: '생성 및 삭제',
    configuration: '데모 설정',
    configure: '설정',
  },
  menu: {
    label: '데모 모드',
    switchAccount: '계정 전환',
    title: '데모 환경입니다',
    description:
      '데이터는 매일 자동으로 초기화되며 변경 사항은 저장되지 않습니다.',
    accountsDescription:
      '아래 계정으로 전환해 각 역할이 무엇에 접근할 수 있는지 확인하세요.',
    loading: '계정을 불러오는 중…',
  },
  accounts: {
    title: '계정',
    description:
      '아래 계정 중 하나로 데모에 들어가 각 계정이 보는 화면을 확인하세요.',
    enter: '들어가기',
    current: '현재',
    entering: '들어가는 중…',
    failed: '이 계정으로 들어갈 수 없습니다.',
    unavailable: '지금은 들어갈 수 있는 계정이 없습니다.',
    password: '비밀번호로 로그인',
  },
  refused: {
    title: '데모 환경입니다. 변경 사항은 저장되지 않습니다.',
    description: '그 밖의 기능은 평소처럼 작동합니다.',
  },
  settings: {
    title: '데모 환경',
    refresh: '새로 고침',
    retry: '다시 시도',
    busy: '데모 데이터를 생성하거나 삭제하는 중입니다',
    busyHelp: '현재 데이터 작업이 끝날 때까지 기다려 주세요.',
    disabled: {
      title: '이 애플리케이션은 데모가 아닙니다',
      help: '데모 모드가 꺼져 있습니다. 배포 시 NOCOBASE_DEMO_MODE=true로 켭니다.',
    },
    errors: {
      failed: '요청이 완료되지 않았습니다. 다시 시도하세요.',
      demoModeRequired: '데모 모드가 켜져 있을 때만 사용할 수 있습니다.',
      signedOut: '세션이 종료되었습니다. 다시 로그인하세요.',
      denied: '데모 설정을 볼 권한이 없습니다.',
    },
    data: {
      title: '데모 데이터',
      state: {
        importing: '생성 중',
        clearing: '삭제 중',
        resetting: '초기화 중',
        failed: '실패',
        ready: '준비됨',
        none: '생성되지 않음',
      },
      presentSummary: '{{language}}(으)로 생성됨 · {{time}}',
      resettingSummary:
        '현재 데이터를 삭제한 뒤 {{language}}(으)로 다시 생성합니다.',
      phase: {
        clearing: '삭제 중',
        generating: '다시 생성 중',
      },
      absentSummary: '아직 생성된 데모 데이터가 없습니다.',
      failed: '마지막 실행이 완료되지 않았습니다',
      unavailable: '데모 데이터 없음',
      unavailableHelp:
        '이 애플리케이션은 데모 데이터 세트를 등록하지 않습니다.',
    },
    visitors: {
      unavailable: '지금은 들어갈 수 있는 계정이 없습니다.',
      title: '계정',
      username: '사용자 이름 {{username}}',
      copyLink: '링크 복사',
      copyLinkFor: '{{name}}의 입장 링크 복사',
      openFor: '{{name}}(으)로 데모 열기',
      copied: '복사됨',
      copyFailed: '복사할 수 없습니다. 주소 표시줄에서 링크를 복사하세요.',
    },
    schedule: {
      title: '매일 초기화',
      description:
        '데모 데이터는 매일 자동으로 초기화됩니다. 일정은 환경 변수로 설정합니다.',
      time: '시간',
      language: '언어',
      timezone: '시간대',
      next: '다음 초기화: {{time}}',
    },
  },
};

export default koKR;
