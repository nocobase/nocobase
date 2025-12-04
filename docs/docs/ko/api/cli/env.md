:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 전역 환경 변수

## TZ

애플리케이션의 시간대를 설정하는 데 사용되며, 기본값은 운영체제의 시간대입니다.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
시간 관련 작업은 이 시간대에 따라 처리됩니다. TZ를 수정하면 데이터베이스의 날짜 값에 영향을 줄 수 있습니다. 자세한 내용은 '[날짜 및 시간 개요](#)'를 참조하십시오.
:::

## APP_ENV

애플리케이션 환경입니다. 기본값은 `development`이며, 다음 옵션이 있습니다:

- `production` - 프로덕션 환경
- `development` - 개발 환경

```bash
APP_ENV=production
```

## APP_KEY

사용자 토큰 생성 등에 사용되는 애플리케이션의 비밀 키입니다. 자신만의 애플리케이션 키로 변경하고 외부에 노출되지 않도록 주의하십시오.

:::warning
APP_KEY가 변경되면 기존 토큰도 무효화됩니다.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

애플리케이션 포트입니다. 기본값은 `13000`입니다.

```bash
APP_PORT=13000
```

## API_BASE_PATH

NocoBase API 주소 접두사입니다. 기본값은 `/api/`입니다.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

다중 코어(클러스터) 시작 모드입니다. 이 변수를 설정하면 `pm2 start` 명령에 `-i <instances>` 매개변수로 전달됩니다. 옵션은 pm2의 `-i` 매개변수와 동일합니다([PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/) 참조). 다음을 포함합니다:

- `max`: CPU 최대 코어 수 사용
- `-1`: CPU 최대 코어 수 -1 사용
- `<number>`: 코어 수 지정

기본값은 비어 있으며, 이는 이 모드가 활성화되지 않음을 의미합니다.

:::warning{title="참고"}
이 모드는 클러스터 모드 관련 플러그인과 함께 사용해야 합니다. 그렇지 않으면 애플리케이션 기능에 이상이 발생할 수 있습니다.
:::

자세한 내용은 [클러스터 모드](#)를 참조하십시오.

## PLUGIN_PACKAGE_PREFIX

플러그인 패키지 이름 접두사입니다. 기본값은 `@nocobase/plugin-,@nocobase/preset-`입니다.

예를 들어, `my-nocobase-app` 프로젝트에 `hello` 플러그인을 추가하는 경우, 플러그인의 전체 패키지 이름은 `@my-nocobase-app/plugin-hello`가 됩니다.

PLUGIN_PACKAGE_PREFIX는 다음과 같이 설정할 수 있습니다:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

그러면 플러그인 이름과 패키지 이름의 매핑은 다음과 같습니다:

- `users` 플러그인의 패키지 이름은 `@nocobase/plugin-users`입니다.
- `nocobase` 플러그인의 패키지 이름은 `@nocobase/preset-nocobase`입니다.
- `hello` 플러그인의 패키지 이름은 `@my-nocobase-app/plugin-hello`입니다.

## DB_DIALECT

데이터베이스 유형입니다. 다음 옵션이 있습니다:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

데이터베이스 호스트입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

기본값은 `localhost`입니다.

```bash
DB_HOST=localhost
```

## DB_PORT

데이터베이스 포트입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

- MySQL, MariaDB 기본 포트: 3306
- PostgreSQL 기본 포트: 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

데이터베이스 이름입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

```bash
DB_DATABASE=nocobase
```

## DB_USER

데이터베이스 사용자입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

데이터베이스 비밀번호입니다 (MySQL 또는 PostgreSQL 데이터베이스를 사용할 때 필요합니다).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

데이터베이스 테이블 접두사입니다.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

데이터베이스 테이블 이름과 필드 이름을 스네이크 케이스(snake case) 스타일로 변환할지 여부입니다. 기본값은 `false`입니다. MySQL(MariaDB) 데이터베이스를 사용하고 `lower_case_table_names=1`인 경우, DB_UNDERSCORED는 반드시 `true`여야 합니다.

:::warning
`DB_UNDERSCORED=true`인 경우, 데이터베이스의 실제 테이블 및 필드 이름은 인터페이스에 보이는 것과 다를 수 있습니다. 예를 들어, `orderDetails`는 데이터베이스에서 `order_details`가 됩니다.
:::

## DB_LOGGING

데이터베이스 로깅 스위치입니다. 기본값은 `off`이며, 다음 옵션이 있습니다:

- `on` - 활성화
- `off` - 비활성화

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

로그 출력 방식입니다. 여러 개를 사용할 경우 `,`로 구분합니다. 개발 환경의 기본값은 `console`이고, 프로덕션 환경의 기본값은 `console,dailyRotateFile`입니다. 옵션은 다음과 같습니다:

- `console` - `console.log`
- `file` - 파일
- `dailyRotateFile` - 일별 로테이션 파일

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

파일 기반 로그 저장 경로입니다. 기본값은 `storage/logs`입니다.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

출력 로그 레벨입니다. 개발 환경의 기본값은 `debug`이고, 프로덕션 환경의 기본값은 `info`입니다. 옵션은 다음과 같습니다:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

데이터베이스 로그 출력 레벨은 `debug`이며, `DB_LOGGING`에 의해 출력 여부가 제어되고 `LOGGER_LEVEL`의 영향을 받지 않습니다.

## LOGGER_MAX_FILES

보관할 최대 로그 파일 수입니다.

- `LOGGER_TRANSPORT`가 `file`인 경우, 기본값은 `10`입니다.
- `LOGGER_TRANSPORT`가 `dailyRotateFile`인 경우, `[n]d`는 일수를 나타냅니다. 기본값은 `14d`입니다.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

크기별 로그 로테이션입니다.

- `LOGGER_TRANSPORT`가 `file`인 경우, 단위는 `byte`이며 기본값은 `20971520 (20 * 1024 * 1024)`입니다.
- `LOGGER_TRANSPORT`가 `dailyRotateFile`인 경우, `[n]k`, `[n]m`, `[n]g`를 사용할 수 있습니다. 기본적으로 설정되지 않습니다.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

로그 출력 형식입니다. 개발 환경의 기본값은 `console`이고, 프로덕션 환경의 기본값은 `json`입니다. 옵션은 다음과 같습니다:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

참조: [로그 형식](#)

## CACHE_DEFAULT_STORE

사용할 캐시 저장소의 고유 식별자이며, 서버 측 기본 캐시 방식을 지정합니다. 기본값은 `memory`이며, 내장 옵션은 다음과 같습니다:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

메모리 캐시 항목의 최대 개수입니다. 기본값은 `2000`입니다.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis 연결입니다. 선택 사항입니다. 예시: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

텔레메트리 데이터 수집을 활성화합니다. 기본값은 `off`입니다.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

활성화된 모니터링 지표 수집기입니다. 기본값은 `console`입니다. 다른 값은 해당 수집기 플러그인에 등록된 이름을 참조해야 합니다 (예: `prometheus`). 여러 개를 사용할 경우 `,`로 구분합니다.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

활성화된 트레이스 데이터 프로세서입니다. 기본값은 `console`입니다. 다른 값은 해당 프로세서 플러그인에 등록된 이름을 참조해야 합니다. 여러 개를 사용할 경우 `,`로 구분합니다.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```