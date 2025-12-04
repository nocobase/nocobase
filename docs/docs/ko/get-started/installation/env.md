:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 환경 변수

## 환경 변수를 설정하는 방법

### Git 소스 코드 또는 `create-nocobase-app` 설치 방식

프로젝트 루트 디렉터리에 있는 `.env` 파일에서 환경 변수를 설정합니다. 환경 변수를 수정한 후에는 애플리케이션 프로세스를 종료하고 다시 시작해야 합니다.

### Docker 설치 방식

`docker-compose.yml` 설정을 수정하고 `environment` 매개변수에서 환경 변수를 설정합니다. 예시:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

`env_file`을 사용하여 `.env` 파일에 환경 변수를 설정할 수도 있습니다. 예시:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

환경 변수를 수정한 후에는 앱 컨테이너를 다시 빌드해야 합니다.

```yml
docker compose up -d app
```

## 전역 환경 변수

### TZ

애플리케이션의 시간대를 설정하는 데 사용되며, 기본값은 운영체제의 시간대입니다.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
시간 관련 작업은 이 시간대에 따라 처리됩니다. TZ를 변경하면 데이터베이스의 날짜 값에 영향을 미칠 수 있습니다. 자세한 내용은 「[날짜 & 시간 개요](/data-sources/data-modeling/collection-fields/datetime)」를 참조하십시오.
:::

### APP_ENV

애플리케이션 환경입니다. 기본값은 `development`이며, 다음 옵션이 있습니다:

- `production` 프로덕션 환경
- `development` 개발 환경

```bash
APP_ENV=production
```

### APP_KEY

애플리케이션의 비밀 키로, 사용자 토큰 등을 생성하는 데 사용됩니다. 자신만의 애플리케이션 키로 변경하고 외부에 유출되지 않도록 주의하십시오.

:::warning
APP_KEY가 변경되면 기존 토큰도 무효화됩니다.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

애플리케이션 포트입니다. 기본값은 `13000`입니다.

```bash
APP_PORT=13000
```

### API_BASE_PATH

NocoBase API 주소 접두사입니다. 기본값은 `/api/`입니다.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

다중 코어(클러스터) 시작 모드입니다. 이 변수를 설정하면 `pm2 start` 명령에 `-i <instances>` 매개변수로 전달됩니다. 옵션은 pm2 `-i` 매개변수와 동일하며 ([PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/) 참조), 다음을 포함합니다:

- `max`: CPU 최대 코어 수 사용
- `-1`: CPU 최대 코어 수 -1 사용
- `<number>`: 지정된 코어 수

기본값은 비어 있으며, 이는 활성화되지 않음을 의미합니다.

:::warning{title="주의"}
이 모드는 클러스터 모드 관련 플러그인과 함께 사용해야 합니다. 그렇지 않으면 애플리케이션 기능에 예기치 않은 문제가 발생할 수 있습니다.
:::

자세한 내용은 [클러스터 모드](/cluster-mode)를 참조하십시오.

### PLUGIN_PACKAGE_PREFIX

플러그인 패키지 이름 접두사입니다. 기본값은 `@nocobase/plugin-,@nocobase/preset-`입니다.

예를 들어, `my-nocobase-app` 프로젝트에 `hello` 플러그인을 추가하면 플러그인의 전체 패키지 이름은 `@my-nocobase-app/plugin-hello`가 됩니다.

PLUGIN_PACKAGE_PREFIX는 다음과 같이 설정할 수 있습니다:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

그러면 플러그인 이름과 패키지 이름의 대응 관계는 다음과 같습니다:

- `users` 플러그인의 패키지 이름은 `@nocobase/plugin-users`입니다.
- `nocobase` 플러그인의 패키지 이름은 `@nocobase/preset-nocobase`입니다.
- `hello` 플러그인의 패키지 이름은 `@my-nocobase-app/plugin-hello`입니다.

### DB_DIALECT

데이터베이스 유형입니다. 다음 옵션이 있습니다:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

데이터베이스 호스트입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

기본값은 `localhost`입니다.

```bash
DB_HOST=localhost
```

### DB_PORT

데이터베이스 포트입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

- MySQL, MariaDB의 기본 포트는 3306입니다.
- PostgreSQL의 기본 포트는 5432입니다.

```bash
DB_PORT=3306
```

### DB_DATABASE

데이터베이스 이름입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

```bash
DB_DATABASE=nocobase
```

### DB_USER

데이터베이스 사용자입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

데이터베이스 비밀번호입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

데이터 테이블 접두사입니다.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

데이터베이스 테이블 이름과 필드 이름을 스네이크 케이스 스타일로 변환할지 여부입니다. 기본값은 `false`입니다. MySQL(MariaDB) 데이터베이스를 사용하고 `lower_case_table_names=1`인 경우, DB_UNDERSCORED는 반드시 `true`여야 합니다.

:::warning
`DB_UNDERSCORED=true`일 때, 데이터베이스의 실제 테이블 이름과 필드 이름은 UI에 표시되는 것과 다를 수 있습니다. 예를 들어, `orderDetails`는 데이터베이스에서 `order_details`로 저장됩니다.
:::

### DB_LOGGING

데이터베이스 로그 스위치입니다. 기본값은 `off`이며, 다음 옵션이 있습니다:

- `on` 켜기
- `off` 끄기

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

데이터베이스 연결 풀의 최대 연결 수입니다. 기본값은 `5`입니다.

### DB_POOL_MIN

데이터베이스 연결 풀의 최소 연결 수입니다. 기본값은 `0`입니다.

### DB_POOL_IDLE

데이터베이스 연결 풀의 유휴 시간입니다. 기본값은 `10000` (10초)입니다.

### DB_POOL_ACQUIRE

데이터베이스 연결 풀에서 연결을 가져오는 최대 대기 시간입니다. 기본값은 `60000` (60초)입니다.

### DB_POOL_EVICT

데이터베이스 연결 풀 연결의 최대 수명 시간입니다. 기본값은 `1000` (1초)입니다.

### DB_POOL_MAX_USES

연결이 폐기되고 교체되기 전에 사용될 수 있는 횟수입니다. 기본값은 `0` (제한 없음)입니다.

### LOGGER_TRANSPORT

로그 출력 방식입니다. 여러 개는 `,`로 구분합니다. 개발 환경의 기본값은 `console`이고, 프로덕션 환경의 기본값은 `console,dailyRotateFile`입니다. 옵션:

- `console` - `console.log`
- `file` - 파일
- `dailyRotateFile` - 일별 로테이션 파일

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

파일 기반 로그 저장 경로입니다. 기본값은 `storage/logs`입니다.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

출력 로그 레벨입니다. 개발 환경의 기본값은 `debug`이고, 프로덕션 환경의 기본값은 `info`입니다. 옵션:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

데이터베이스 로그 출력 레벨은 `debug`이며, `DB_LOGGING`에 의해 출력 여부가 제어되고 `LOGGER_LEVEL`의 영향을 받지 않습니다.

### LOGGER_MAX_FILES

최대 보존 로그 파일 수입니다.

- `LOGGER_TRANSPORT`가 `file`일 때, 기본값은 `10`입니다.
- `LOGGER_TRANSPORT`가 `dailyRotateFile`일 때, `[n]d`는 일수를 나타냅니다. 기본값은 `14d`입니다.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

크기별 로그 로테이션입니다.

- `LOGGER_TRANSPORT`가 `file`일 때, 단위는 `byte`이며, 기본값은 `20971520 (20 * 1024 * 1024)`입니다.
- `LOGGER_TRANSPORT`가 `dailyRotateFile`일 때, `[n]k`, `[n]m`, `[n]g`를 사용할 수 있습니다. 기본적으로 설정되어 있지 않습니다.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

로그 출력 형식입니다. 개발 환경의 기본값은 `console`이고, 프로덕션 환경의 기본값은 `json`입니다. 옵션:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

참고: [로그 형식](/log-and-monitor/logger/index.md#로그-형식)

### CACHE_DEFAULT_STORE

캐싱 방식의 고유 식별자이며, 서버의 기본 캐싱 방식을 지정합니다. 기본값은 `memory`이며, 내장 옵션은 다음과 같습니다:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

메모리 캐시 항목의 최대 개수입니다. 기본값은 `2000`입니다.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Redis 연결입니다. 선택 사항입니다. 예시: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

텔레메트리 데이터 수집을 활성화합니다. 기본값은 `off`입니다.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

활성화된 모니터링 지표 수집기입니다. 기본값은 `console`입니다. 다른 값은 해당 수집기 플러그인이 등록한 이름을 참조해야 합니다 (예: `prometheus`). 여러 개는 `,`로 구분합니다.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

활성화된 추적 데이터 프로세서입니다. 기본값은 `console`입니다. 다른 값은 해당 프로세서 플러그인이 등록한 이름을 참조해야 합니다. 여러 개는 `,`로 구분합니다.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## 실험적 환경 변수

### APPEND_PRESET_LOCAL_PLUGINS

사전 설정된 비활성 플러그인을 추가하는 데 사용됩니다. 값은 플러그인 패키지 이름(`package.json`의 `name` 매개변수)이며, 여러 플러그인은 쉼표로 구분합니다.

:::info
1. 플러그인이 로컬에 다운로드되어 `node_modules` 디렉터리에서 찾을 수 있는지 확인해야 합니다. 자세한 내용은 [플러그인 구성 방식](/plugin-development/project-structure)을 참조하십시오.
2. 환경 변수를 추가한 후에는 초기 설치(`nocobase install`) 또는 업그레이드(`nocobase upgrade`)를 완료해야 플러그인 관리자 페이지에 표시됩니다.
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

내장되어 기본적으로 설치되는 플러그인을 추가하는 데 사용됩니다. 값은 플러그인 패키지 이름(`package.json`의 `name` 매개변수)이며, 여러 플러그인은 쉼표로 구분합니다.

:::info
1. 플러그인이 로컬에 다운로드되어 `node_modules` 디렉터리에서 찾을 수 있는지 확인해야 합니다. 자세한 내용은 [플러그인 구성 방식](/plugin-development/project-structure)을 참조하십시오.
2. 환경 변수를 추가한 후에는 초기 설치(`nocobase install`) 또는 업그레이드(`nocobase upgrade`) 시 플러그인이 자동으로 설치되거나 업그레이드됩니다.
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## 임시 환경 변수

NocoBase를 설치할 때, 임시 환경 변수를 설정하여 설치를 보조할 수 있습니다. 예를 들어:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# 등가
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# 등가
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

설치 시 언어입니다. 기본값은 `en-US`이며, 다음 옵션이 있습니다:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

루트 사용자 이메일입니다.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

루트 사용자 비밀번호입니다.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

루트 사용자 닉네임입니다.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```