import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  access: {
    section: '릴리스',
    pages: {
      'rel-apps': '앱',
    },
    businessSection: '릴리스',
    businesses: {
      apps: {
        title: '앱',
        description: '앱과 릴리스, 배포, 실행 상태입니다.',
        actions: {
          view: {
            title: '앱 보기',
            description: '앱과 릴리스, 배포, 실행 상태를 봅니다',
            related: '앱 보기(관련된 앱)',
            relatedLabel: '내가 만든 앱',
            relatedHint: '내가 만든 앱과 애플리케이션이 나와 연결한 앱',
            all: '앱 보기(전체)',
          },
          readLogs: {
            title: '로그 읽기',
            description: '앱 및 배포 로그를 읽습니다',
            related: '로그 읽기(관련된 앱)',
            relatedLabel: '내가 만든 앱',
            relatedHint: '내가 만든 앱과 애플리케이션이 나와 연결한 앱',
            all: '로그 읽기(전체)',
          },
          create: {
            title: '앱 생성',
            description: '환경에 앱을 만듭니다',
            all: '앱 생성',
          },
          configure: {
            title: '앱 설정',
            description: '비밀 정보가 포함될 수 있는 앱 설정을 읽고 변경합니다',
            related: '앱 설정(관련된 앱)',
            relatedLabel: '내가 만든 앱',
            relatedHint: '내가 만든 앱과 애플리케이션이 나와 연결한 앱',
            all: '앱 설정(전체)',
          },
          upload: {
            title: '릴리스 업로드',
            description: '릴리스를 업로드하고 승격합니다',
            related: '릴리스 업로드(관련된 앱)',
            relatedLabel: '내가 만든 앱',
            relatedHint: '내가 만든 앱과 애플리케이션이 나와 연결한 앱',
            all: '릴리스 업로드(전체)',
          },
          deploy: {
            title: '배포',
            description:
              '보호되지 않은 환경에 배포 및 롤백하고, 보호된 환경에는 배포를 요청합니다',
            related: '배포(관련된 앱)',
            relatedLabel: '내가 만든 앱',
            relatedHint: '내가 만든 앱과 애플리케이션이 나와 연결한 앱',
            all: '배포(전체)',
          },
          deployProtected: {
            title: '보호된 배포 승인',
            description:
              '승인자가 지정되지 않은 보호된 환경으로의 배포를 승인합니다. 사람만 가능합니다',
            related: '보호된 배포 승인(관련된 앱)',
            relatedLabel: '내가 만든 앱',
            relatedHint: '내가 만든 앱과 애플리케이션이 나와 연결한 앱',
            all: '보호된 배포 승인(전체)',
          },
          operate: {
            title: '시작 및 중지',
            description: '앱을 시작, 중지, 재시작합니다',
            related: '시작 및 중지(관련된 앱)',
            relatedLabel: '내가 만든 앱',
            relatedHint: '내가 만든 앱과 애플리케이션이 나와 연결한 앱',
            all: '시작 및 중지(전체)',
          },
          delete: {
            title: '앱 삭제',
            description: '앱과 데이터를 삭제합니다',
            related: '앱 삭제(관련된 앱)',
            relatedLabel: '내가 만든 앱',
            relatedHint: '내가 만든 앱과 애플리케이션이 나와 연결한 앱',
            all: '앱 삭제(전체)',
          },
        },
      },
    },
    recordAccess: {
      owned: '본인이 만든 앱',
    },
    settings: {
      rel: {
        environments: '배포 환경',
      },
    },
    keyScopes: {
      apps: {
        title: '앱 및 배포',
        description:
          '읽기: 앱, 릴리스, 배포, 로그를 봅니다. 읽기 및 쓰기: 릴리스 업로드도 가능합니다. 관리자: 배포와 앱 시작·중지도 가능합니다.',
        objects: '앱',
      },
      environments: {
        title: '배포 환경',
        description:
          '읽기: 환경 목록을 봅니다. 읽기 및 쓰기: 환경을 관리합니다.',
      },
      presets: {
        ciDeploy: {
          title: 'CI 배포',
          description: '90일 동안 선택한 앱에 릴리스를 업로드하고 배포합니다.',
        },
        ciUpload: {
          title: 'CI 업로드',
          description:
            '90일 동안 선택한 앱에 릴리스를 업로드만 하고 배포하지 않습니다.',
        },
      },
    },
    actions: {
      read: '보기',
      manage: '관리',
      view: '보기',
      'read-logs': '로그 읽기',
      create: '생성',
      configure: '설정',
      upload: '릴리스 업로드',
      deploy: '배포',
      'deploy-protected': '보호된 배포 승인',
      operate: '시작 및 중지',
      delete: '삭제',
    },
  },
  drivers: {
    host: '이 서버',
  },
};

export default koKR;
