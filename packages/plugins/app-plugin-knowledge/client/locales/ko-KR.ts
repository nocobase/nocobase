import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  indexing: {
    failedDocumentCount: '실패한 문서: {{count}}',
    enabled: '인덱싱 사용',
    enabledHint:
      '끄면 텍스트 검색만 사용합니다. 변경 사항은 저장 후 적용됩니다.',
    chooseInstance: '인덱싱 인스턴스 선택',
    documentProgress: '문서 진행 상황',
    pendingDocuments: '대기 중인 문서',
    failedDocuments: '실패한 문서',
    preparedChunks: '준비된 청크',
    committedChunks: '저장된 청크',
    agentPrompt:
      '이 NocoBase 3 애플리케이션에서 지식 베이스 인덱싱 설정을 도와줘.\n\n애플리케이션의 AGENTS.md를 읽고 여기서 실제로 사용할 수 있는 인덱싱 유형(type)을 확인해. 현재 Knowledge는 두 가지 벡터 데이터베이스를 제공해: sqlite-vec를 쓰는 SQLite(type sqlite-vec, 로컬 파일)와 pgvector를 쓰는 PostgreSQL(type pgvector, vector 확장 필요). 이 배포에서 사용할 수 있는 옵션과 요구 사항을 설명해 줘. 계속하기 전에 내가 선택하게 하고, 나 대신 결정하지 마.\n\n내가 선택하면 필요한 정보를 물어봐: SQLite는 인덱스 파일 위치, PostgreSQL은 데이터베이스 연결 정보와 vector 확장 준비 여부. 비밀번호나 API 키는 표시하지 마.\n\n애플리케이션의 config.yaml에서 knowledge.indexing 아래에 쓰기 전에 제안할 설정을 보여 주고 내 확인을 받아. 다른 설정은 유지해. 애플리케이션이 config.yml을 사용하면 새 파일을 만들지 말고 기존 파일을 수정해.\n\n설정을 안전하게 검증하고 애플리케이션을 다시 시작하는 방법을 설명해. 다시 시작하거나 의존성을 설치하기 전에 내 확인을 받아. 그다음 인덱스 설정으로 돌아가 인덱싱을 켜고 인스턴스와 임베딩 모델을 선택해 저장하도록 안내해 줘. 유료 모델을 호출하거나 인덱스를 다시 빌드하기 전에는 확인을 요청해.',
    databases: {
      sqlite: {
        name: 'SQLite 벡터 데이터베이스',
        description:
          'sqlite-vec 벡터 확장을 사용해 애플리케이션 서버의 로컬 SQLite 파일에 인덱스를 저장합니다. 별도의 데이터베이스 서비스가 필요 없으며 단일 호스트 배포에 적합합니다.',
      },
      pgvector: {
        name: 'PostgreSQL 벡터 데이터베이스',
        description:
          'pgvector 벡터 확장을 사용해 PostgreSQL에 벡터를 저장하고 검색합니다. 데이터베이스 연결을 준비하고 vector 확장을 활성화하세요. 기존 PostgreSQL 서비스나 여러 애플리케이션 서버가 인덱스를 공유하는 경우에 적합합니다.',
      },
    },
    setupTitle: '설정 단계',
    setup: {
      instance:
        '애플리케이션의 config.yaml을 열고 knowledge.indexing 아래에 이름, 유형, 로컬 파일 경로 또는 데이터베이스 연결 정보를 포함한 인스턴스를 추가하세요.',
      restart: '파일을 저장하고 애플리케이션을 다시 시작해 설정을 불러오세요.',
      enable:
        '인덱스 설정을 다시 열어 인덱싱을 켜고 새 인스턴스와 임베딩 모델을 선택한 뒤 저장하세요.',
    },
    agentHandoff:
      '설정 파일이 익숙하지 않다면 아래 프롬프트를 복사해 개발 Agent에게 도움을 요청하세요.',
    global: '모든 지식 공간',
    back: '지식으로 돌아가기',
    configuration: '인덱스 설정',
    typeHint:
      '인스턴스는 유형별로 묶여 있습니다. 유형마다 고유한 양식이 있으며, 모든 인덱스에 임베딩 모델이 필요한 것은 아닙니다.',
    typeForm: '이 유형이 제공하는 설정 양식',
    openPage: '별도 설정 페이지 열기',
    emptyTitle: '먼저 벡터 데이터베이스를 설정하세요',
    emptyDescription:
      '지식 인덱싱에는 문서 벡터를 저장하고 검색할 벡터 데이터베이스가 필요합니다. 아래 옵션 중 하나를 선택해 애플리케이션의 config.yaml에 추가하세요:',
    agentTitle: '설정 프롬프트',
    copyPrompt: '설정 프롬프트 복사',
    promptCopied: '설정 프롬프트를 복사했습니다. 아무것도 실행되지 않았습니다.',
    promptCopyFallback:
      '자동 복사를 사용할 수 없습니다. 프롬프트가 선택되어 있으니 직접 복사하세요.',
    promptLabel: '개발 Agent용 설정 프롬프트',
    rebuildHint: '변경하려면 인덱스를 다시 빌드해야 합니다',
    editHint: '저장하려면 설정을 편집하세요',
    confirmRetryEmbedding:
      '모든 지식 공간에서 실패한 문서만 다시 시도합니다. 임베딩 호출에 비용이 발생할 수 있으며, 완료된 작업은 다시 빌드하지 않습니다.',
    confirmRetry:
      '모든 지식 공간에서 실패한 문서만 다시 시도합니다. 완료된 작업은 다시 빌드하지 않으며 인덱스 서비스 리소스가 사용됩니다.',
    confirmResources:
      '모든 지식 공간에 영향을 주며 인덱스를 다시 빌드합니다. 이 유형은 임베딩 호출이 필요 없지만 인덱스 저장 공간과 서비스 리소스를 사용합니다. 게시된 인덱스는 대체 인덱스가 준비될 때까지 계속 사용할 수 있습니다.',
    deploymentPg:
      '연결, 스키마, 테이블 접두사는 이 양식이 아니라 배포 설정에서 관리합니다.',
    deploymentFile:
      '인덱스 파일 경로는 이 양식이 아니라 배포 설정에서 관리합니다.',
    errors: {
      configurationChanged:
        '인덱스 또는 모델 설정이 변경되었습니다. 이전 세대는 새 설정으로 다시 시도할 수 없습니다. 설정을 검토하고 필요하면 모든 공간을 다시 빌드하세요(임베딩 비용이 발생할 수 있음).',
      modelAuth:
        '임베딩 인증에 실패했습니다. 모델 서비스의 API 키, 접근 권한, 엔드포인트 리전을 확인하세요.',
      modelQuota:
        '임베딩 할당량이나 크레딧이 소진되었습니다. 다시 시도하기 전에 모델 계정을 확인하세요.',
      modelRateLimit:
        '임베딩 서비스가 요청 속도를 제한하고 있습니다. 잠시 후 다시 시도하세요.',
      modelConfig:
        '저장된 임베딩 모델을 사용할 수 없거나 변경되었거나 지원되지 않습니다. 모델 서비스와 모델 선택을 확인하세요.',
      modelInput: '임베딩 입력이 너무 깁니다. 문서 청크 크기를 확인하세요.',
      modelPolicy:
        '임베딩 서비스가 콘텐츠 정책에 따라 입력을 거부했습니다. 해당 콘텐츠를 확인하세요.',
      modelResponse:
        '임베딩 서비스가 잘못된 벡터를 반환했습니다. 모델 호환성과 벡터 차원을 확인하세요.',
      modelUnavailable:
        '임베딩 서비스에 연결할 수 없거나 일시적으로 사용할 수 없습니다. 엔드포인트와 네트워크를 확인하세요.',
      storageAuth:
        '인덱스 저장소 인증에 실패했습니다. 데이터베이스 사용자, 비밀번호, 연결 설정을 확인하세요.',
      storagePermission:
        '인덱스 저장소가 작업을 거부했거나 읽기 전용입니다. 스키마와 테이블 권한을 확인하세요.',
      storageSchema:
        '인덱스 데이터베이스, 스키마 또는 필요한 테이블을 사용할 수 없습니다. 배포와 스키마를 확인하세요.',
      storageUnavailable:
        '인덱스 저장소에 연결할 수 없거나 연결이 끊겼습니다. 주소, 포트, 네트워크를 확인하세요.',
      storageBusy:
        '인덱스 저장소가 사용 중이거나 트랜잭션 충돌이 발생했습니다. 호스트 재시도 정책을 기다리세요.',
      timeout:
        '인덱싱 작업 시간이 초과되었습니다. 다시 시도하기 전에 저장소와 모델 서비스 가용성을 확인하세요.',
      vectorExtension:
        'PostgreSQL에 vector 확장이 없습니다. 데이터베이스 관리자에게 설치를 요청하세요.',
      ownership:
        '인덱스 대상의 소유권이나 구조가 일치하지 않습니다. 인스턴스 리소스를 확인하고 관련 없는 테이블은 삭제하지 마세요.',
      dependencies:
        '인덱싱 인스턴스, 확장 또는 호스트 작업 설정을 사용할 수 없습니다. 배포 설정을 확인하고 필요하면 다시 시작하세요.',
    },
    invalidValue: '이 값을 확인하세요.',
    title: '지식 인덱스 설정',
    description: '모든 지식 공간의 검색 인덱싱을 설정합니다.',
    progress: '인덱싱 진행 상황',
    instance: '인덱싱 인스턴스',
    off: '끔 — 텍스트 검색만 사용',
    missingForm:
      '이 인스턴스의 설정 양식을 사용할 수 없습니다. 저장된 옵션은 유지됩니다.',
    statusFailed: '인덱싱 상태를 새로 고칠 수 없습니다.',
    loadFailed:
      '인덱스 설정을 불러올 수 없습니다. 접근 권한을 확인하고 다시 시도하세요.',
    saveFailed: '요청이 수락되지 않았습니다. 초안은 유지됩니다.',
    conflict:
      '다른 곳에서 인덱스 설정이 변경되었습니다. 초안을 유지한 채 최신 버전을 다시 불러온 뒤 검토하고 다시 저장하세요.',
    saved: '요청이 수락되었습니다. 인덱싱은 백그라운드에서 계속됩니다.',
    workFailed:
      '일부 인덱싱 작업이 실패했습니다. 인스턴스와 모델 서비스를 확인한 뒤 다시 시도하세요.',
    rebuild: '모든 공간 다시 빌드',
    retry: '실패한 작업 다시 시도',
    confirmTitle: '전역 인덱스 변경 확인',
    confirmRebuild:
      '모든 지식 공간에 영향을 주며 모든 문서를 다시 임베딩할 수 있어 모델 비용과 추가 저장 공간이 필요할 수 있습니다. 현재 인덱스는 대체 인덱스가 준비될 때까지 계속 사용할 수 있습니다.',
    confirmDisable:
      '모든 지식 공간에서 인덱스 검색을 끕니다. 텍스트 검색은 계속 사용할 수 있으며 정리는 백그라운드에서 진행됩니다.',
    discardTitle: '저장하지 않은 변경 사항을 버릴까요?',
    discardDescription: '저장하지 않은 인덱스 설정이 사라집니다.',
    discard: '변경 사항 버리기',
    confirm: '확인',
    documents:
      '문서: {{done}} / {{total}} · 대기: {{pending}} · 실패: {{failed}}',
    chunks: '준비된 청크: {{prepared}} · 저장됨: {{committed}}',
    availability: {
      disabled: '사용 안 함 — 텍스트 검색만 사용',
      unavailable: '인덱스를 사용할 수 없음 — 텍스트 검색은 사용 가능',
      building: '인덱스 빌드 중',
      ready: '인덱스 준비됨',
      degraded: '인덱스 성능 저하 — 텍스트 검색은 사용 가능',
    },
    table: '테이블 이름',
    modelService: '모델 서비스',
    model: '임베딩 모델',
    chooseService: '모델 서비스 선택',
    chooseModel: '모델 이름을 선택하거나 입력',
    loadingModels: '임베딩 모델을 불러오는 중…',
    modelsUnavailable:
      '임베딩 모델을 사용할 수 없습니다. 모델 서비스를 확인하고 다시 시도하세요.',
  },
  access: {
    businessSection: '지식',
    settingsSection: '지식',
    settings: {
      indexing: {
        title: '지식 인덱싱',
        read: '보기',
        configure: '구성',
        rebuild: '재구축',
      },
    },
    businesses: {
      knowledge: {
        title: '지식',
        description: '각 지식 공간의 문서입니다.',
        actions: {
          read: {
            title: '지식 읽기',
            description: '시스템 지식과 관련된 공간의 지식을 읽습니다',
            related: '지식 읽기(관련된 공간)',
            relatedLabel: '나와 관련된 공간',
            relatedHint:
              '어떤 공간이 누구와 관련되는지는 애플리케이션이 정합니다',
            all: '지식 읽기(전체)',
          },
          propose: {
            title: '지식 제안',
            description:
              '편집 권한이 있는 사람이 결정할 변경을 제안합니다. Agent에게 줄 수 있는 권한입니다',
            related: '지식 제안(관련된 공간)',
            relatedLabel: '나와 관련된 공간',
            relatedHint:
              '어떤 공간이 누구와 관련되는지는 애플리케이션이 정합니다',
            all: '지식 제안(전체)',
          },
          edit: {
            title: '지식 편집',
            description:
              '편집, 보관, 검증 표시와 제안 결정을 합니다. 시스템 지식에는 전체 권한이 필요합니다',
            related: '지식 편집(관련된 공간)',
            relatedLabel: '나와 관련된 공간',
            relatedHint:
              '어떤 공간이 누구와 관련되는지는 애플리케이션이 정합니다',
            all: '지식 편집(전체)',
          },
          manage: {
            title: '지식 접근 관리',
            description:
              '각 폴더와 문서에 누가 접근할 수 있는지 변경하고 전체에 대한 접근을 유지합니다. 시스템 지식에는 전체 권한이 필요합니다',
            related: '지식 접근 관리(관련된 공간)',
            relatedLabel: '나와 관련된 공간',
            relatedHint:
              '어떤 공간이 누구와 관련되는지는 애플리케이션이 정합니다',
            all: '지식 접근 관리(전체)',
          },
        },
      },
    },
  },
  knowledge: {
    directory: {
      title: '지식',
      system: '시스템 지식',
      count_one: '문서 {{count}}개',
      count_other: '문서 {{count}}개',
      archivedCount_one: '보관된 문서 {{count}}개',
      archivedCount_other: '보관된 문서 {{count}}개',
      selectTarget: '{{title}} 열기',
      target: '{{title}}에 만들기',
      chooseTarget: '만들 프로젝트 또는 시스템 지식을 선택하세요',
      expandAll: '모두 펼치기',
      collapseAll: '모두 접기',
      retry: '다시 시도',
      allProposals: '모든 제안',
      reviewPage: '{{pages}}쪽 중 {{page}}쪽 · 전체 {{total}}',
      previous: '이전',
      next: '다음',
      empty: '접근할 수 있는 지식 공간이 없습니다',
      emptyAccessHint:
        '관리자에게 프로젝트 지식이나 시스템 지식에 대한 접근을 요청하세요.',
      noAccess: '이 지식을 사용할 수 없거나 더 이상 접근 권한이 없습니다.',
      emptyHint: '이 공간을 열어 문서를 만들거나 편집자에게 추가를 요청하세요.',
      createFailed: '항목을 만들 수 없습니다. 대상을 확인하고 다시 시도하세요.',
      showResults: '“{{q}}”의 상위 결과 보기',
      topResults: '모든 프로젝트와 시스템 지식에서 순위가 높은 섹션입니다.',
      welcome:
        '프로젝트나 공유 시스템 지식을 펼쳐 문서를 찾아보세요. 공간을 선택해 그곳에 만들거나, 접근 권한이 있는 모든 지식을 검색하세요.',
    },
    title: '지식',
    someone: '누군가',
    loading: '불러오는 중',
    index: {
      states: {
        pending: '대기 중',
        done: '인덱싱됨',
        failed: '실패',
      },
      done: '인덱싱됨',
      pending: '인덱싱 중 {{indexed}}/{{total}}',
      failed: '인덱싱 실패',
      failedHint: '일부 섹션은 모든 시도 후에도 임베딩하지 못했습니다.',
      reason: '원인: {{reason}}',
      retry: '다시 인덱싱',
      refreshFailed: '인덱싱 상태를 새로 고칠 수 없습니다',
      retryRefresh: '새로 고침 다시 시도',
      queued: '인덱싱 대기열에 다시 추가됨',
    },
    chunks: {
      open: '섹션 보기',
      title: '섹션',
      description:
        '"{{title}}"의 현재 버전은 {{count}}개 섹션으로 나뉘며, 검색과 인용은 섹션 단위로 작동합니다. 섹션을 선택하면 문서에서 찾아 줍니다.',
      lead: '(첫 제목 이전)',
      lines: '{{start}}–{{end}}행',
      chars_one: '{{count}}자',
      chars_other: '{{count}}자',
      empty: '이 문서에는 아직 섹션이 없습니다.',
      showing: '{{start}}–{{end}}행을 강조 표시하는 중입니다.',
      clear: '강조 해제',
    },
    chunking: {
      title: '섹션 설정',
      description:
        '{{space}}의 문서와 파일(추출된 텍스트)은 검색과 인용을 위해 제목 기준으로 섹션이 나뉩니다. Word는 자체 제목을 유지하고, PDF·슬라이드의 각 페이지와 각 시트는 2단계 제목이 되며, 제목이 없는 텍스트는 길이로 나뉩니다. 이 공간은 기본값과 다르게 나눌 수 있습니다.',
      own: '이 공간에 따로 설정',
      defaults:
        '기본값: {{depth}}단계 제목까지, 목표 {{target}}자, 최대 {{max}}자.',
      depth: '나눌 제목 수준',
      depths: {
        '1': '1단계만(#)',
        '2': '2단계까지(##)',
        '3': '3단계까지(###)',
      },
      depthHint:
        '더 깊은 제목은 해당 섹션 안에 남습니다. 1단계만 선택하면 파일은 페이지나 시트로 나뉘지 않습니다.',
      target: '목표 길이(자)',
      max: '최대 길이(자)',
      sizesHint:
        '최대 길이보다 긴 섹션은 문단 사이에서 목표 길이에 가깝게 나뉩니다. 코드 블록과 표는 나누지 않습니다.',
      invalid:
        '길이는 {{min}}~{{max}}이며 목표 길이는 최대 길이 이하여야 합니다.',
      effect:
        '저장하면 백그라운드에서 문서를 다시 나누고, 의미 검색이 켜져 있으면 섹션을 다시 인덱싱합니다.',
      rechunking: '백그라운드에서 문서를 다시 나누는 중…',
      save: '저장',
      saved: '섹션 설정을 저장했습니다',
    },
    loadFailed: '지식을 불러올 수 없습니다',
    kinds: {
      folder: '폴더',
      article: '문서',
      file: '파일',
    },
    folder: {
      empty: '이 폴더는 비어 있습니다.',
    },
    new: {
      label: '새로 만들기',
      article: '새 문서',
      folder: '새 폴더',
      childArticle: '안에 새 문서',
      childFolder: '안에 새 폴더',
    },
    files: {
      upload: '파일 업로드',
      uploadHere: '여기에 파일 업로드',
      dropHint: '파일을 여기나 폴더 위에 놓으면 업로드됩니다.',
      uploaded_one:
        '파일 {{count}}개를 업로드했습니다. 텍스트를 추출하는 중입니다.',
      uploaded_other:
        '파일 {{count}}개를 업로드했습니다. 텍스트를 추출하는 중입니다.',
      download: '다운로드',
      version: '버전 {{version}}',
      statusHint: {
        parsing:
          '텍스트를 추출하는 중입니다. 준비되면 검색에서 파일을 찾을 수 있습니다.',
        ready: '텍스트가 추출되어 검색과 Agent가 읽을 수 있습니다.',
        failed: '텍스트를 추출할 수 없습니다.',
        unsupported:
          '이 형식의 파일에서는 텍스트를 추출하지 않으며 그대로 저장됩니다.',
      },
      replace: '교체',
      replaced: '교체됨: 버전 {{version}}.',
      reparse: '다시 추출',
      file: '파일',
      propose: '제안',
      proposeNew: '파일 제안',
      proposeNewHint:
        '이 지식을 편집할 수 있는 사람이 결정하며, 수락하면 파일이 추가됩니다.',
      proposeReplace: '교체 제안',
      proposeReplaceHint:
        '이 지식을 편집할 수 있는 사람이 결정하며, 수락하면 내 파일이 {{title}}의 다음 버전이 됩니다.',
      proposeReasonHint:
        '결정하는 사람을 위해 여기에 필요한 이유를 적어 주세요.',
      proposed: '제안했습니다. 편집할 수 있는 사람이 결정합니다.',
      preview: '미리 보기',
      text: '추출된 텍스트',
      failed: '텍스트를 추출할 수 없습니다: {{reason}}',
      status: {
        parsing: '텍스트 추출 중',
        ready: '텍스트 추출됨',
        failed: '추출 실패',
        unsupported: '저장만 됨',
      },
      noText: {
        parsing: '텍스트를 추출하는 중입니다. 준비되면 여기에 표시됩니다.',
        ready: '파일에 텍스트가 없습니다.',
        failed: '텍스트를 추출할 수 없습니다.',
        unsupported:
          '이 형식의 파일에서는 텍스트를 추출하지 않으며 파일은 그대로 저장됩니다.',
      },
    },
    spaces: {
      actions: '공간 작업',
      access: '공간 접근',
      proposeOnly: '제안만 가능',
      inherited: '상속됨',
      inheritedHint: '다른 공간에서 상속되어 여기서는 읽기 전용입니다.',
      default: '지식',
      readOnly: '읽기 전용',
      empty: '아직 문서가 없습니다.',
    },
    tree: {
      actions: '작업',
      expand: '펼치기',
      collapse: '접기',
      label: '문서',
      newDoc: '새 문서',
      archived: '보관됨 표시',
      archivedBadge: '보관됨',
      pending: '{{count}}개 대기 중',
      back: '모든 문서',
      restricted: '제한됨: 목록에 있는 사람만 접근할 수 있습니다',
    },
    doc: {
      permissions: '권한',
      restricted: '제한됨 · {{count}}',
      restrictedHint: '목록에 있는 사람과 공간 관리자만 접근할 수 있습니다.',
      verifiedLabel: '검증됨',
      versionBy: 'v{{version}} · {{name}}',
      proposeChanges: '변경 제안',
      more: '추가 작업',
      pending_one: '{{count}}개 대기 중',
      pending_other: '{{count}}개 대기 중',
      updatedAgo: '{{time}} 업데이트됨',
      updatedDetail: '{{name}} · v{{version}}',
      renameTitle: '“{{title}}” 이름 바꾸기',
      renamedToast: '이름을 바꿨습니다.',
      notFound: '이 문서가 더 이상 없거나 볼 수 없습니다.',
      notVerified: '아직 검증되지 않음',
      contents: '목차',
      edit: '편집',
      rename: '이름 바꾸기',
      history: '기록',
      verify: '검증됨으로 표시',
      verifiedToast: '검증됨으로 표시했습니다.',
      archive: '보관',
      archiveTitle: '“{{title}}”을(를) 보관할까요?',
      archiveDescription:
        '트리와 Agent에서 사라집니다. 나중에 복원할 수 있으며 버전은 유지됩니다.',
      archivedToast: '보관했습니다.',
      restore: '복원',
      restoredToast: '복원했습니다.',
      move: '이동',
      moveTitle: '“{{title}}” 이동',
      moveTo: '위치',
      root: '최상위',
      movedToast: '이동했습니다.',
      archivedNotice: '보관된 문서이며 읽기 전용입니다.',
      oldVersion: '버전 {{version}}을(를) 보고 있습니다.',
      backToCurrent: '현재 버전으로 돌아가기',
      proposals: '대기 중인 제안',
      empty: '이 문서는 비어 있습니다.',
    },
    editor: {
      editing: '편집 중',
      proposing: '변경 제안 중',
      properties: '속성',
      propertiesHint: 'Agent와 링크가 이 문서에 대해 읽는 정보입니다.',
      nothingToPreview: '아직 미리 볼 내용이 없습니다.',
      reasonPlaceholder:
        '결정하는 사람을 위해 변경이 필요한 이유를 적어 주세요',
      submitProposal: '제안 제출',
      proposed: '제안했습니다. 편집할 수 있는 사람이 결정합니다.',
      title: '제목',
      slug: 'Slug',
      slugHint:
        '영문 소문자, 숫자, 하이픈만 사용합니다. Agent와 링크가 문서를 부르는 이름이며, 비워 두면 제목으로 만듭니다.',
      summary: '요약',
      summaryHint: 'Agent가 목록에서 읽는 한 줄 설명입니다.',
      content: '내용',
      contentPlaceholder: 'Markdown',
      write: '작성',
      preview: '미리 보기',
      note: '변경 메모',
      notePlaceholder: '기록에 남길 변경 내용(선택)',
      parent: '상위 항목',
      save: '저장',
      saved: '버전 {{version}}(으)로 저장했습니다.',
      unchanged: '변경된 내용이 없습니다.',
      create: '만들기',
      created: '문서를 만들었습니다.',
      cancel: '취소',
      conflict:
        '편집하는 동안 다른 사람이 버전 {{version}}을(를) 저장했습니다. 내 텍스트를 복사하고 다시 불러온 뒤 변경을 다시 적용하세요.',
      reload: '다시 불러오기',
    },
    history: {
      by: '작성자 {{name}}',
      title: '기록',
      current: '현재',
      fromProposal: '제안에서',
      compare: '비교',
      with: '대상:',
      previous: '이전 버전',
      noChanges: '차이가 없습니다.',
      view: '보기',
      unchangedLines: '변경되지 않은 줄 {{count}}개',
      approvedBy: '승인자 {{name}}',
    },
    search: {
      description: '이 공간과 이 공간이 상속하는 공간의 문서를 검색합니다.',
      hint: '입력해 제목과 본문을 검색하세요.',
      emptyHint: '다른 단어를 쓰거나 단어 수를 줄여 보세요.',
      all: '“{{q}}”의 모든 결과 보기',
      resultsFor: '“{{q}}” 검색 결과',
      placeholder: '지식 검색',
      label: '지식 검색',
      empty: '“{{q}}”에 대한 결과가 없습니다.',
      results: '결과',
      inherited: '상속됨',
    },
    home: {
      emptyTitle: '{{space}}에 아직 문서가 없습니다',
      emptyEdit: '첫 문서를 작성하거나 파일을 업로드해 시작하세요.',
      emptyPropose:
        '파일을 제안하면 편집할 수 있는 사람이 추가 여부를 결정합니다.',
      emptyRead: '아직 작성된 내용이 없습니다.',
      count_one: '문서 {{count}}개',
      count_other: '문서 {{count}}개',
      pending_one: '검토 대기 중({{count}})',
      pending_other: '검토 대기 중({{count}})',
      all: '모두 보기',
      recent: '최근 업데이트',
      updated: '{{time}} · {{name}}',
      unindexed: '인덱싱이 완료되지 않음',
      unindexedFailed: '실패 {{failed}} · 대기 {{pending}}',
      unindexedPending_one: '섹션 {{count}}개 대기 중',
      unindexedPending_other: '섹션 {{count}}개 대기 중',
      unverified: '최근 검증되지 않음',
      verifiedAgo: '{{time}} 검증됨',
    },
    diff: {
      changes_one: '변경 {{count}}개',
      changes_other: '변경 {{count}}개',
      previous: '이전 변경',
      next: '다음 변경',
      layout: '비교 방식',
      inline: '한 열',
      split: '두 열',
    },
    access: {
      you: {
        manage: '관리 가능',
        edit: '편집 가능',
        propose: '제안 가능',
        read: '읽기 가능',
        none: '접근 권한 없음',
      },
      title: '공간 접근',
      description: '{{space}}에 접근할 수 있는 사람입니다.',
      yours: '내 접근 권한',
      actions: {
        read: '문서를 읽고 검색합니다',
        propose: '편집할 수 있는 사람이 결정할 변경을 제안합니다',
        edit: '문서를 편집, 정리, 검증합니다',
        manage: '각 폴더와 문서에 누가 접근할 수 있는지 변경합니다',
      },
      allowed: '허용',
      notAllowed: '허용 안 함',
      matrix: '역할별',
      role: '역할',
      columns: {
        read: '읽기',
        propose: '제안',
        edit: '편집',
        manage: '관리',
      },
      from: '출처: {{source}}',
      source: {
        space: '{{space}}에 대한 내 접근 권한',
        manager: '내가 {{space}}을(를) 관리함',
        entry: '{{subject}}, “{{title}}”에 설정됨',
      },
      restrictedAt:
        '“{{title}}”에서 제한됨: 그곳에 나열된 사람만 접근할 수 있습니다.',
      viewOnly: '관리하는 사람만 접근 권한을 변경할 수 있습니다.',
      mine: '(나)',
      howTitle: '여기서 접근 권한이 작동하는 방식',
      agents:
        '다른 사람을 대신하는 Agent는 최대 읽기와 제안만 할 수 있으며 편집하거나 결정하지 않습니다.',
      manage: '역할에서 변경',
    },
    permissions: {
      title: '“{{title}}”의 권한',
      description: {
        folder:
          '이 폴더와 그 안의 항목을 읽고, 제안하고, 편집하고, 관리할 수 있는 사람입니다.',
        article:
          '이 문서를 읽고, 제안하고, 편집하고, 관리할 수 있는 사람입니다.',
        file: '이 파일을 읽고, 제안하고, 편집하고, 관리할 수 있는 사람입니다.',
      },
      modeLabel: '접근',
      modes: {
        inherit: '상위 항목에서 상속',
        custom: '나열된 사람만',
      },
      inheritHint:
        '상위 항목에 접근할 수 있는 사람은 여기도 접근할 수 있으며, 아래에 추가한 사람은 최소한 지정된 수준을 받습니다.',
      customHint:
        '상위 항목의 허용 여부와 관계없이 아래에 나열된 사람만 접근할 수 있습니다. 하위 항목도 자체적으로 제한하지 않는 한 이를 따릅니다.',
      inherited: '상속됨',
      fromSpace: '역할에 따라 {{space}}에 접근할 수 있는 모든 사람',
      fromDoc: '“{{title}}”에서',
      fromRestricted: '나열된 사람만 접근할 수 있는 “{{title}}”에서',
      added: '추가로 접근 가능',
      listed: '나열된 사람',
      add: '사람 추가',
      addPlaceholder: '사람, 역할 추가…',
      noMatches: '일치하는 항목이 없습니다.',
      noneAdded: '상속된 사람 외에는 없습니다.',
      noneListed: '나열된 사람이 없습니다. 공간 관리자만 접근할 수 있습니다.',
      managers:
        '공간 관리자는 항상 접근 권한을 유지합니다. Agent는 최대 읽기와 제안만 할 수 있으며, Agent와 해당 사람 모두에게 허용된 것만 가능합니다.',
      levelOf: '{{subject}}의 수준',
      levels: {
        read: '읽기 가능',
        propose: '제안 가능',
        edit: '편집 가능',
        manage: '관리 가능',
      },
      remove: '삭제',
      removedSubject: '삭제됨({{id}})',
      save: '저장',
      close: '닫기',
      saved: '권한을 저장했습니다.',
      loadFailed: '권한을 불러올 수 없습니다.',
    },
    searchTest: {
      title: '검색 테스트',
      description:
        '나와 같은 조건으로 검색을 실행하고 각 결과의 순위가 어떻게 매겨졌는지 보여 줍니다: 관련성, 키워드와 의미 기준 순위, 재순위 점수, 문서 내 위치.',
      keyword: '키워드',
      semantic: '의미',
      relevance: '관련성 {{score}}',
      rank: '{{name}} #{{rank}} · {{score}}',
      unranked: '{{name}}: 찾을 수 없음',
      lines: '{{start}}–{{end}}행',
      notExplained:
        '순위 상세는 공간이나 검색 설정을 관리하는 사람에게만 표시됩니다.',
      query: '검색할 단어',
      run: '검색',
      fused: '통합 {{score}}',
      provider: '{{name}} #{{rank}} · {{score}}',
      reranked: '재순위 {{score}}',
      notReranked: '재순위 없음',
    },
    proposals: {
      listTitle: '제안',
      statuses: {
        pending: '대기 중',
        accepted: '수락됨',
        rejected: '거절됨',
        withdrawn: '철회됨',
      },
      none: {
        pending: '검토를 기다리는 항목이 없습니다.',
        accepted: '아직 수락된 제안이 없습니다.',
        rejected: '거절된 제안이 없습니다.',
      },
      about: '“{{title}}” 관련',
      clearAbout: '모든 제안 보기',
      onBehalf: '{{person}}을(를) 대신한 {{proposer}}',
      overview: '개요',
      changes: '변경 사항',
      staleTitle: '이후 문서가 변경됨',
      decision: '결정',
      commentLabel: '댓글',
      pendingEntry: '검토 대기 · {{count}}',
      kinds: {
        update: '변경',
        create: '새 문서',
        verify: '여전히 유효함',
      },
      by: '{{person}}을(를) 위한 {{proposer}}',
      from: '출처: {{source}}',
      reason: '이유',
      summary: '요약',
      stale:
        '제안을 작성한 후 문서가 변경되었습니다(v{{base}} → v{{current}}). 수락하면 현재 버전 전체가 제안으로 대체됩니다.',
      diffProposed: '제안된 변경(v{{base}} → 제안)',
      diffCurrent: '현재 버전과 비교(v{{current}} → 제안)',
      newContent: '제안된 내용',
      newFile: '제안된 파일',
      replacementFile: '버전 {{base}}의 교체 파일',
      fileNote: '수락되면 텍스트를 추출합니다.',
      verifyNote:
        '문서 내용은 바뀌지 않으며 오늘 날짜로 검증됨으로 표시됩니다.',
      accept: '수락',
      acceptAnyway: '그래도 수락',
      reject: '거절',
      comment: '댓글(선택)',
      accepted: '수락했습니다.',
      rejected: '거절했습니다.',
      decided: '{{name}}: {{outcome}}',
      open: '열기',
      readOnly: '이 지식을 편집할 수 있는 사람이 결정합니다.',
    },
  },
  errors: {
    KNOWLEDGE_PROPOSAL_PENDING:
      '이 문서에 대한 이전 제안이 아직 대기 중입니다. 먼저 결정되어야 합니다.',
    KNOWLEDGE_PROPOSAL_REJECTED:
      '같은 변경이 이전에 거절되었습니다. 다른 내용을 제안하세요.',
    EMPTY_CONTENT: '제안된 내용이 비어 있습니다.',
    INVALID_REASON: '변경해야 하는 이유를 적어 주세요(최대 500자).',
    KNOWLEDGE_VERSION_CONFLICT:
      '그사이 다른 사람이 새 버전을 저장했습니다. 다시 불러와 변경을 다시 적용하세요.',
    KNOWLEDGE_SLUG_TAKEN: '이 공간의 다른 문서가 이미 이 slug를 사용합니다.',
    KNOWLEDGE_HAS_CHILDREN: '먼저 하위 문서를 보관하거나 이동하세요.',
    KNOWLEDGE_ARCHIVED: '보관된 문서입니다. 먼저 복원하세요.',
    KNOWLEDGE_DEPTH_EXCEEDED: '문서는 최대 4단계까지 중첩할 수 있습니다.',
    KNOWLEDGE_INVALID_MOVE:
      '문서를 자기 자신이나 하위 항목 아래로 옮길 수 없습니다.',
    KNOWLEDGE_PROPOSAL_STALE: '제안을 작성한 후 문서가 변경되었습니다.',
    KNOWLEDGE_PROPOSAL_DECIDED: '이미 결정된 제안입니다.',
    INVALID_SLUG: 'Slug에는 영문 소문자, 숫자, 하이픈만 쓸 수 있습니다.',
    INVALID_TITLE: '제목이 필요합니다(최대 200자).',
    FILE_TOO_LARGE: '파일이 너무 큽니다.',
    FILES_UNAVAILABLE: '이 애플리케이션은 파일을 저장하지 않습니다.',
    INVALID_FILE: '파일을 하나만 보내세요.',
    INVALID_PARENT: '파일 아래에는 아무것도 둘 수 없습니다.',
    KNOWLEDGE_NOT_FAILED:
      '텍스트 추출에 실패한 파일만 다시 추출할 수 있습니다.',
  },
  ui: {
    nav: {
      knowledge: '지식',
    },
  },
  common: {
    forbidden: '이 작업을 수행할 권한이 없습니다.',
    requestFailed: '요청에 실패했습니다. 다시 시도하세요.',
  },
};

export default koKR;
