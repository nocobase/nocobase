import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  access: {
    section: 'Agent 관리',
    businessSection: 'Agent 관리',
    businesses: {
      agents: {
        title: 'Agent 및 스킬',
        description: 'Agent와 Agent가 사용하는 스킬입니다.',
        actions: {
          edit: {
            title: 'Agent 및 스킬 관리',
            description:
              'Agent의 설정, 스킬, 변수를 변경하고 보관, 복원, 삭제하며 스킬을 편집합니다. Agent는 편집자 본인의 권한을 넘는 기능을 받지 않습니다',
            related: 'Agent 및 스킬 관리(소유한 Agent와 만든 스킬)',
            relatedLabel: '내가 소유한 Agent와 내가 만든 스킬',
            relatedHint: '내가 소유자인 Agent와 내가 만든 스킬',
            all: 'Agent 및 스킬 관리(전체)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agent',
        runners: '실행 환경',
        prices: '모델 가격',
        services: '모델 서비스',
      },
    },
    actions: {
      read: '보기',
      manage: '관리',
    },
    keyScopes: {
      agents: {
        title: 'Agent',
        description:
          'Agent, 스킬, 실행을 보고 Agent와 스킬을 변경하며 실행을 취소하고 다시 시도합니다.',
      },
      runners: {
        title: '실행 환경',
        description: '실행 환경과 등록 토큰을 보고 실행 환경을 관리합니다.',
      },
      prices: {
        title: '모델 가격',
        description: '비용 추정에 쓰이는 모델 가격을 보고 변경합니다.',
      },
      services: {
        title: '모델 서비스',
        description:
          '모델 서비스와 제공하는 모델을 봅니다. 키는 표시되지 않습니다.',
      },
    },
  },
  runnerConversation: {
    title: '대화: {{title}}',
    other: '다른 사람의 대화',
    untitled: '새 대화',
  },
};

export default koKR;
