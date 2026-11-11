import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  roles: {
    owner: '소유자',
    admin: '관리자',
    member: '구성원',
  },
  access: {
    sections: {
      projects: '프로젝트',
      issues: '작업',
      settings: '프로젝트 설정',
      members: '구성원 및 역할',
    },
    businesses: {
      projects: {
        title: '프로젝트',
        description: '프로젝트와 구성원, 저장소, 진행 상황입니다.',
        actions: {
          view: {
            title: '프로젝트 보기',
            description: '프로젝트와 개요, 진행 상황을 봅니다',
            related: '프로젝트 보기(볼 수 있는 프로젝트)',
            relatedLabel: '내가 볼 수 있는 프로젝트',
            relatedHint: '공개 프로젝트와 내가 이끌거나 참여한 비공개 프로젝트',
            all: '프로젝트 보기(전체)',
          },
          create: {
            title: '프로젝트 생성',
            description: '새 프로젝트를 시작하고 이끕니다',
            all: '프로젝트 생성',
          },
          manage: {
            title: '프로젝트 관리',
            description:
              '이름, 상태, 날짜, 리더를 변경하고 구성원과 저장소를 관리합니다',
            related: '프로젝트 관리(이끄는 프로젝트)',
            relatedLabel: '내가 이끄는 프로젝트',
            relatedHint: '내가 리더인 프로젝트',
            all: '프로젝트 관리(전체)',
          },
          delete: {
            title: '프로젝트 삭제',
            description: '프로젝트를 삭제하고 삭제된 프로젝트를 복원합니다',
            all: '프로젝트 삭제',
          },
        },
      },
      issues: {
        title: '작업',
        description: '프로젝트 안이나 단독으로 있는 작업과 그 댓글입니다.',
        actions: {
          view: {
            title: '작업 보기',
            description: '목록, 보드, 상세 화면에서 작업을 봅니다',
            related: '작업 보기(볼 수 있는 작업)',
            relatedLabel: '내가 볼 수 있는 프로젝트의 작업',
            relatedHint:
              '프로젝트가 없는 작업과 내가 볼 수 있는 프로젝트의 작업',
            all: '작업 보기(전체)',
          },
          create: {
            title: '작업 생성',
            description: '프로젝트 안이나 단독으로 작업을 만듭니다',
            related: '작업 생성(볼 수 있는 프로젝트)',
            relatedLabel: '내가 볼 수 있는 프로젝트의 작업',
            relatedHint:
              '프로젝트가 없는 작업 또는 내가 볼 수 있는 프로젝트의 작업',
            all: '작업 생성(전체)',
          },
          edit: {
            title: '작업 편집',
            description:
              '제목, 설명, 우선순위, 날짜, 라벨, 실행자, 진행 중 상태',
            related: '작업 편집(볼 수 있는 작업)',
            relatedLabel: '내가 볼 수 있는 프로젝트의 작업',
            relatedHint:
              '프로젝트가 없는 작업과 내가 볼 수 있는 프로젝트의 작업',
            all: '작업 편집(전체)',
          },
          comment: {
            title: '작업에 댓글 달기',
            description:
              '댓글을 달고 답글을 쓰며 스레드를 해결하고, 자신의 댓글을 편집·삭제합니다',
            related: '작업에 댓글 달기(볼 수 있는 작업)',
            relatedLabel: '내가 볼 수 있는 프로젝트의 작업',
            relatedHint:
              '프로젝트가 없는 작업과 내가 볼 수 있는 프로젝트의 작업',
            all: '작업에 댓글 달기(전체)',
          },
          moderateComments: {
            title: '댓글 관리',
            description: '다른 사람의 댓글을 삭제합니다',
            related: '댓글 관리(소유한 작업 또는 이끄는 프로젝트)',
            relatedLabel: '내가 소유한 작업 또는 내가 이끄는 프로젝트',
            relatedHint:
              '내가 소유한 작업과 내가 이끄는 프로젝트의 작업에 달린 댓글',
            all: '댓글 관리(전체)',
          },
          close: {
            title: '작업 닫기',
            description: '작업을 완료 또는 취소로 표시합니다',
            related: '작업 닫기(소유한 작업 또는 이끄는 프로젝트)',
            relatedLabel: '내가 소유하거나 내가 이끄는 프로젝트의 작업',
            relatedHint: '내가 소유한 작업과 내가 이끄는 프로젝트의 작업',
            all: '작업 닫기(전체)',
          },
          changeOwner: {
            title: '소유자 변경',
            description: '작업을 다른 사람에게 넘겨 책임지게 합니다',
            related: '소유자 변경(소유한 작업 또는 이끄는 프로젝트)',
            relatedLabel: '내가 소유하거나 내가 이끄는 프로젝트의 작업',
            relatedHint: '내가 소유한 작업과 내가 이끄는 프로젝트의 작업',
            all: '소유자 변경(전체)',
          },
          delete: {
            title: '작업 삭제 및 복원',
            description: '작업을 삭제하고 삭제된 작업을 복원합니다',
            all: '작업 삭제 및 복원',
          },
        },
      },
      attachments: {
        title: '첨부 파일',
        description: '작업과 댓글에 첨부된 파일입니다.',
        actions: {
          upload: {
            title: '첨부 파일 업로드',
            description:
              '편집할 수 있는 작업과 자신의 댓글에 파일을 첨부합니다',
            related: '첨부 파일 업로드(볼 수 있는 작업)',
            relatedLabel: '내가 볼 수 있는 프로젝트의 작업',
            relatedHint:
              '프로젝트가 없는 작업과 내가 볼 수 있는 프로젝트의 작업에 있는 파일',
            all: '첨부 파일 업로드(전체)',
          },
        },
      },
    },
    collections: {
      pmProjects: '프로젝트',
      pmIssues: '작업',
    },
    recordAccess: {
      visible: '볼 수 있는 프로젝트와 작업',
      managed: '이끄는 프로젝트와 소유한 작업',
    },
    settings: {
      pm: {
        general: '일반',
        labels: '라벨',
        members: '구성원',
      },
    },
    keyScopes: {
      projects: {
        title: '프로젝트',
        description: '프로젝트를 보고 관리하며 생성·삭제합니다.',
        objects: '프로젝트',
      },
      issues: {
        title: '작업',
        description:
          '작업을 보고 생성, 편집, 댓글, 닫기, 재할당하며 댓글 관리와 작업 삭제를 합니다.',
      },
      settings: {
        title: '프로젝트 설정',
        description: '일반 설정과 라벨입니다.',
      },
    },
    actions: {
      view: '보기',
      create: '생성',
      manage: '관리',
      edit: '편집',
      close: '닫기',
      comment: '댓글',
      moderateComments: '댓글 관리',
      changeOwner: '소유자 변경',
      delete: '삭제',
      upload: '업로드',
      read: '보기',
      update: '편집',
      invite: '초대',
      assign: '역할 할당',
      'define-roles': '역할 정의',
    },
  },
  notifications: {
    batchDone: '{{identifier}}의 모든 하위 작업이 완료되었습니다',
    batchDoneStage: '{{identifier}} 하위 작업의 {{stage}}단계가 완료되었습니다',
    commented: '{{actor}} 님이 {{identifier}}에 댓글을 달았습니다',
    dependencyReleased:
      '{{releasedBy}}이(가) 완료되어 {{identifier}}을(를) 시작할 수 있습니다',
    executorAssigned: '{{actor}} 님이 {{identifier}}을(를) 나에게 할당했습니다',
    mentioned: {
      comment: '{{actor}} 님이 {{identifier}}에서 나를 언급했습니다',
      description: '{{actor}} 님이 {{identifier}}에서 나를 언급했습니다',
    },
    ownerAssigned: '{{actor}} 님이 나를 {{identifier}}의 소유자로 지정했습니다',
    someone: '누군가',
    statusChanged: '{{identifier}}이(가) {{status}}(으)로 이동했습니다',
    ownerNotified: '{{identifier}}이(가) 이제 {{status}} 상태입니다',
  },
  status: {
    backlog: '백로그',
    blocked: '차단됨',
    cancelled: '취소됨',
    done: '완료',
    in_progress: '진행 중',
    in_review: '검토 중',
  },
};

export default koKR;
