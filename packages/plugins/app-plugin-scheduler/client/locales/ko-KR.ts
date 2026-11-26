import type { SchedulerResource } from './en-US.js';

const koKR: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: { title: '예약 작업', read: '조회', manage: '관리' },
  nav: { automation: '자동화', schedules: '예약 작업' },
  page: {
    title: '예약 작업',
    description:
      '플러그인과 애플리케이션이 코드로 정의하고 일정에 따라 실행하는 작업입니다. 언제 실행되는지, 각 실행이 어떻게 끝났는지 확인하고 일시 중지하거나 재개할 수 있습니다. 규칙은 코드에 있으며, 이 페이지에서는 만들거나 변경할 수 없습니다.',
    loadFailed: '예약 작업을 불러오지 못했습니다.',
    retry: '다시 시도',
    close: '닫기',
    copy: '복사',
    copied: '복사됨',
    loadMore: '더 불러오기',
    none: '—',
    tabs: { tasks: '작업', runs: '실행 기록', config: '구성' },
  },
  tasks: {
    attention: {
      title_one: '{{count}}개 항목에 조치가 필요합니다',
      title_other: '{{count}}개 항목에 조치가 필요합니다',
      target:
        '“{{title}}”의 대상 {{target}}을(를) 사용할 수 없어({{state}}) 모든 실행이 건너뜀으로 기록됩니다.',
      waiting:
        '{{time}}에 시작된 “{{title}}” 실행이 아직 결과를 기다리고 있습니다.',
      failed: '“{{title}}”의 최근 실행이 {{status}} 상태로 끝났습니다.',
    },
    stats: {
      total: '예약 작업',
      running: '실행 중',
      attention: '조치 필요',
      next: '다음 실행',
      nextOf: '다음 실행 · {{title}}',
    },
    filters: {
      all: '전체',
      running: '실행 중',
      attention: '조치 필요',
      paused: '일시 중지됨',
      removed: '코드에서 제거됨',
      search: '이름 또는 key로 검색',
    },
    columns: {
      task: '작업',
      rule: '규칙',
      next: '다음 실행',
      last: '마지막 실행',
      totals: '누계',
      state: '상태',
      enabled: '사용',
    },
    totals: '실행 {{runs}}회 · 성공 {{succeeded}}회',
    noMatch: '이 필터에 맞는 예약 작업이 없습니다.',
    enable: '“{{title}}” 재개',
    disable: '“{{title}}” 일시 중지',
    toggleFailed: '예약 작업을 변경하지 못했습니다.',
    readOnly:
      '예약 작업을 볼 수는 있지만 일시 중지하거나 재개할 수는 없습니다.',
    notes: {
      running:
        '“실행 중”은 예약 작업이 사용 설정되어 있고 대상이 존재한다는 뜻일 뿐입니다. 작업이 성공했는지는 각 실행의 결과로 확인하세요. 누계에는 실패와 건너뜀을 포함한 모든 실행이 포함됩니다.',
      pause:
        '일시 중지는 이후 실행에만 영향을 줍니다. 코드 업데이트나 재배포 후에도 이 설정은 그대로 유지됩니다.',
      removed:
        '“코드에서 제거됨”: `scheduler sync --finalize` 실행 후 더 이상 코드에 없는 예약 작업은 이렇게 표시됩니다. 기록은 유지되며 재개할 수 없습니다.',
      internal:
        '알림 재전송, 메일 동기화, 지식 인덱싱, 에이전트 실행 정리 같은 내부 백그라운드 작업은 여기에 표시되지 않으며, 각 플러그인이 관리합니다.',
    },
  },
  state: {
    running: '실행 중',
    paused: '일시 중지됨',
    unavailable: '대상 사용 불가',
    removed: '코드에서 제거됨',
  },
  targetState: {
    ready: '사용 가능',
    disabled: '비활성화됨',
    missing: '없음',
    invalid: '잘못된 구성',
  },
  pause: {
    title: '“{{title}}”을(를) 일시 중지할까요?',
    description: '누군가 재개할 때까지 예정된 시간에 실행되지 않습니다.',
    running: '이미 시작되었거나 결과를 기다리는 실행은 취소되지 않습니다.',
    missed:
      '재개하면 다음 예정 시간부터 계속되며, 일시 중지 중에 놓친 실행은 보충되지 않습니다.',
    redeploy: '재배포해도 재개되지 않습니다.',
    limit:
      '실행 횟수 제한이 있는 예약 작업은 지금까지의 실행 횟수가 계속 누적됩니다.',
    cancel: '취소',
    confirm: '일시 중지',
  },
  empty: {
    title: '아직 예약 작업이 없습니다',
    description:
      '예약 작업은 플러그인이나 애플리케이션이 코드에서 `defineSchedule`로 정의합니다. 예약 작업을 정의하는 플러그인을 설치하거나 애플리케이션에서 정의한 뒤 다시 시작하면 여기에 나타납니다.',
    internal:
      '알림 재전송, 메일 동기화, 지식 인덱싱 같은 내부 백그라운드 작업은 여기에 표시되지 않으며, 각자의 규칙에 따라 계속 실행됩니다.',
  },
  detail: {
    back: '예약 작업',
    notFound: '이 예약 작업이 존재하지 않습니다.',
    key: 'Key',
    rule: '규칙',
    upcoming: '다음 실행',
    noUpcoming: '예정 없음',
    window: '기간 · 실행 횟수 제한',
    unlimited: '제한 없음',
    windowFrom: '{{time}}부터',
    windowTo: '{{time}}까지',
    limit_one: '{{count}}회',
    limit_other: '{{count}}회',
    target: '대상',
    totals: '누계',
    source: '정의 위치',
    sourceCode:
      '코드(`defineSchedule`). 규칙이나 대상을 변경하려면 코드를 수정하고 다시 배포하세요.',
    runs: '실행 기록',
    noRuns: '아직 실행 기록이 없습니다.',
    runsNote:
      '실행 기록은 최신순으로 표시됩니다. 실행 대상의 구성은 반환되거나 표시되지 않습니다. 실행 횟수가 1보다 크면 같은 실행이 다시 전달되었다는 뜻이며, 여전히 한 번의 실행으로 집계됩니다.',
  },
  runs: {
    allTasks: '모든 예약 작업',
    groups: {
      all: '전체',
      failed: '실패 · 시간 초과',
      waiting: '결과 대기 중',
      skipped: '건너뜀',
      succeeded: '성공',
    },
    ranges: {
      day: '최근 24시간',
      week: '최근 7일',
      month: '최근 30일',
      quarter: '최근 90일',
    },
    columns: {
      planned: '예정 시간',
      task: '예약 작업',
      result: '결과',
      reason: '사유 · 관련 항목',
      executions: '실행 횟수',
      duration: '소요 시간',
      summary: '결과 요약',
    },
    noRuns: '이 필터에 맞는 실행 기록이 없습니다.',
    notes: {
      order:
        '모든 예약 작업의 실행 기록을 최신순으로 표시합니다. 실패, 시간 초과, 오래 대기 중인 실행은 작업 탭 상단에도 표시됩니다.',
      removed: '코드에서 제거된 예약 작업의 기록도 여기에 남아 있습니다.',
    },
  },
  status: {
    pending: '대기열',
    running: '실행 중',
    waiting: '결과 대기 중',
    succeeded: '성공',
    failed: '실패',
    skipped: '건너뜀',
    cancelled: '취소됨',
    timed_out: '시간 초과',
    triggered: '트리거됨(이전 기록)',
  },
  reason: {
    'target-missing': '대상이 존재하지 않습니다',
    'target-disabled': '대상이 비활성화되어 있습니다',
    'target-invalid': '대상의 구성이 잘못되었습니다',
    'target-not-found': '대상 유형이 등록되지 않았습니다',
    'invalid-config': '대상의 구성이 잘못되었습니다',
    'dispatch-failed': '시작 중 실패했습니다. 서버 로그를 확인하세요',
    'observer-failed': '대상의 결과를 확인하지 못했습니다',
    'observer-unavailable': '대상이 결과를 보고할 수 없습니다',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: '타임라인',
    started: '시작',
    accepted: '대상이 수락함',
    finished: '완료',
    notYet: '아직 결과 없음',
    executions: '실행 횟수',
    target: '대상',
    related: '관련 항목',
    receipt: '접수 정보',
    summary: '결과 요약',
    reason: '사유',
    waitingNote:
      '실행이 결과를 기다리는 동안 스케줄러는 대상이 성공, 실패, 취소 또는 시간 초과를 보고할 때까지 상태를 조회합니다. 스케줄러 자체는 시간 제한을 두지 않으며 대상이 결정합니다. 오래 기다리는 경우 관련 항목을 열어 진행 상황을 확인하세요.',
  },
  config: {
    memory:
      '예약 작업이 이 인스턴스의 메모리에서 실행됩니다. 단일 인스턴스에만 적합합니다.',
    memoryHint:
      '인스턴스가 하나라면 변경할 것이 없습니다. 여러 인스턴스를 실행하려면 아래 “Redis로 전환”을 따르세요.',
    shared:
      '예약 작업이 {{adapter}}에서 실행됩니다. 여러 인스턴스에서 실행할 수 있습니다.',
    columns: {
      setting: '설정',
      value: '현재 값',
      effect: '예약 작업에 미치는 영향',
      source: '출처',
    },
    sources: {
      environment: '환경 변수',
      config: 'config.yml',
      default: '기본값',
      backend: '백엔드에서 설정',
    },
    rows: {
      configuration: 'jobs 구성',
      backend: '백엔드',
      multiInstance: '다중 인스턴스',
      concurrency: '동시 실행 수',
      attempts: '시도 횟수',
      connection: '연결',
    },
    builtIn: '내장 memory',
    selectedByScheduler:
      '`scheduler.jobs`(`SCHEDULER_JOBS`)가 예약 작업 전용으로 선택했습니다.',
    selectedByDefault:
      '`scheduler.jobs`가 설정되지 않아 예약 작업은 `jobs.default`를 따릅니다.',
    selectedByBuiltIn:
      '`scheduler.jobs`와 `jobs.default`가 모두 설정되지 않아 내장 기본값이 적용됩니다.',
    memoryBackend: 'memory(이 인스턴스)',
    memoryEffect:
      '규칙은 이 프로세스의 메모리에 있으며, 정상적으로 종료될 때 {{path}}에 기록됩니다.',
    sharedEffect: '규칙은 {{adapter}}에 있으며 모든 인스턴스가 공유합니다.',
    plugin: '{{plugin}} 등록됨',
    supported: '지원됨',
    unsupported: '지원되지 않음',
    multiSupported:
      '각 실행은 하나의 인스턴스에서만 실행됩니다. 인스턴스가 비정상 종료되면 드물게 실행이 다시 전달될 수 있습니다.',
    multiUnsupported:
      '모든 인스턴스가 각 예약 작업을 따로 실행하므로 같은 작업이 여러 번 실행됩니다.',
    concurrencyEffect_one:
      '한 번에 하나씩 실행됩니다. 느린 실행이 있으면 예정 시간이 된 다른 실행은 기다립니다.',
    concurrencyEffect_other:
      '한 번에 최대 {{count}}개까지 실행되며, 나머지는 대기열에서 기다립니다.',
    attemptsOk: '올바름',
    attemptsWarn: '1이어야 함',
    attemptsEffect:
      '실패한 실행은 실패로 기록되고 예약 작업은 다음 예정 시간에 다시 실행됩니다. 1로 유지하세요.',
    attemptsWarnEffect:
      '실패한 실행은 이미 기록되므로 같은 실행을 재시도해도 아무 일도 일어나지 않습니다. 시도 횟수를 1로 설정하세요.',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: '비밀번호는 표시되지 않습니다.',
    redis: {
      title: 'Redis로 전환(여러 인스턴스용)',
      step1:
        '상용 플러그인 `@nocobase/app-plugin-jobs-redis`를 설치하고 모든 인스턴스에 등록합니다.',
      step2:
        '`config.yml`에 Redis 백엔드를 추가하고 예약 작업이 이를 사용하도록 지정합니다(아래 코드 참고).',
      step3:
        '모든 인스턴스를 다시 배포한 뒤 여기로 돌아와 “다중 인스턴스”가 지원됨으로 표시되는지 확인합니다.',
      warning:
        '이름이 잘못되었거나 플러그인이 등록되지 않았거나 Redis에 연결할 수 없으면 애플리케이션이 시작되지 않으며, memory로 대체되지 않습니다.',
    },
    removed: {
      title: '코드에서 제거된 예약 작업',
      consistent: '일치합니다. 조치할 필요가 없습니다.',
      consistentHint:
        '예약 작업을 코드에서 삭제하고 배포하면 정리 방법과 함께 여기에 표시됩니다.',
      warning_one:
        '{{count}}개의 예약 작업이 이 버전의 코드에 더 이상 없지만 아직 정리되지 않았습니다.',
      warning_other:
        '{{count}}개의 예약 작업이 이 버전의 코드에 더 이상 없지만 아직 정리되지 않았습니다.',
      warningHint:
        '예정 시간이 되어도 실행되지 않지만(로그에 “A schedule fired that this instance has no definition for”가 표시됨) 작업 목록에는 평소처럼 표시됩니다.',
      columns: { task: '예약 작업', last: '마지막 실행', after: '정리 후' },
      after:
        '“코드에서 제거됨”으로 표시되고 다시는 실행되지 않으며 기록은 유지됩니다.',
      neverRan: '실행된 적 없음',
      how: '정리 방법',
      howHint:
        '모든 인스턴스가 새 버전으로 실행되면 아무 서버에서나 한 번 실행하세요:',
      why: '자동으로 하지 않는 이유: 롤링 배포 중에는 이전 버전과 새 버전이 함께 실행되므로, 자동 정리가 이전 버전이 아직 사용하는 예약 작업을 제거할 수 있습니다.',
      full: '모든 플러그인이 포함된 완전한 빌드에서만 실행하세요. 그렇지 않으면 로드되지 않은 플러그인의 예약 작업도 제거됨으로 표시됩니다.',
    },
    readOnly:
      '이 페이지는 읽기 전용입니다. 이 설정은 애플리케이션 구성에 있으며 재배포 시 적용됩니다.',
  },
  cron: {
    everyMinute: '매분',
    everyMinutes: '{{count}}분마다',
    everyHour: '매시 {{minute}}분',
    everyHours: '{{count}}시간마다',
    daily: '매일 {{time}}',
    weekdays: '평일 {{time}}',
    weekly: '매주 {{day}} {{time}}',
    monthly: '매월 {{day}}일 {{time}}',
  },
};

export default koKR;
