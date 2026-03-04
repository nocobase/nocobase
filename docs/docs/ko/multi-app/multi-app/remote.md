---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/multi-app/multi-app/remote)을 참조하세요.
:::

# 다중 환경 모드

## 소개

공유 메모리 모드의 다중 애플리케이션은 배포 및 운영 면에서 뚜렷한 장점이 있지만, 애플리케이션 수와 비즈니스 복잡도가 증가함에 따라 단일 인스턴스는 점차 리소스 경합, 안정성 저하 등의 문제에 직면할 수 있습니다. 이러한 시나리오에 대응하여 사용자는 더 복잡한 비즈니스 요구 사항을 지원하기 위해 다중 환경 혼합 배포 방안을 채택할 수 있습니다.

이 모드에서 시스템은 통합 관리 및 스케줄링 센터로서 하나의 입구 애플리케이션(Supervisor)을 배포하고, 실제 비즈니스 애플리케이션을 담당하는 독립적인 애플리케이션 실행 환경으로서 여러 NocoBase 인스턴스를 배포합니다. 각 환경은 서로 격리되어 협업하며, 이를 통해 단일 인스턴스의 부하를 효과적으로 분산하고 시스템의 안정성, 확장성 및 장애 격리 능력을 현저히 향상시킵니다.

배포 측면에서 서로 다른 환경은 독립된 프로세스에서 실행되거나, 서로 다른 Docker 컨테이너로 배포되거나, 여러 Kubernetes Deployment 형태로 존재할 수 있어 다양한 규모와 아키텍처의 인프라 환경에 유연하게 적응할 수 있습니다.

## 배포

다중 환경 혼합 배포 모드에서:

- 입구 애플리케이션(Supervisor)은 애플리케이션 및 환경 정보를 통합 관리합니다.
- 작업 애플리케이션(Worker)은 실제 비즈니스 실행 환경 역할을 합니다.
- 애플리케이션 및 환경 설정은 Redis를 통해 캐시됩니다.
- 입구 애플리케이션과 작업 애플리케이션 간의 명령 및 상태 동기화는 Redis 통신에 의존합니다.

현재 환경 생성 기능은 아직 제공되지 않으며, 각 작업 애플리케이션은 수동으로 배포하고 해당 환경 정보를 설정해야 입구 애플리케이션에서 인식할 수 있습니다.

### 아키텍처 종속성

배포 전에 다음 서비스를 준비해 주십시오:

- Redis
  - 애플리케이션 및 환경 설정 캐시
  - 입구 애플리케이션과 작업 애플리케이션 간의 명령 통신 채널 역할

- 데이터베이스
  - 입구 애플리케이션과 작업 애플리케이션이 연결해야 하는 데이터베이스 서비스

### 입구 애플리케이션 (Supervisor)

입구 애플리케이션은 통합 관리 센터로서 애플리케이션 생성, 시작, 중지 및 환경 스케줄링, 애플리케이션 접속 프록시를 담당합니다.

입구 애플리케이션 환경 변수 설정 설명

```bash
# 애플리케이션 모드
APP_MODE=supervisor
# 애플리케이션 발견 방식
APP_DISCOVERY_ADAPTER=remote
# 애플리케이션 프로세스 관리 방식
APP_PROCESS_ADAPTER=remote
# 애플리케이션, 환경 설정 캐시 redis
APP_SUPERVISOR_REDIS_URL=
# 애플리케이션 명령 통신 방식
APP_COMMAND_ADPATER=redis
# 애플리케이션 명령 통신 redis
APP_COMMAND_REDIS_URL=
```

### 작업 애플리케이션 (Worker)

작업 애플리케이션은 실제 비즈니스 실행 환경으로서 구체적인 NocoBase 애플리케이션 인스턴스를 탑재하고 실행하는 역할을 합니다.

작업 애플리케이션 환경 변수 설정 설명

```bash
# 애플리케이션 모드
APP_MODE=worker
# 애플리케이션 발견 방식
APP_DISCOVERY_ADAPTER=remote
# 애플리케이션 프로세스 관리 방식
APP_PROCESS_ADAPTER=local
# 애플리케이션, 환경 설정 캐시 redis
APP_SUPERVISOR_REDIS_URL=
# 애플리케이션 명령 통신 방식
APP_COMMAND_ADPATER=redis
# 애플리케이션 명령 통신 redis
APP_COMMAND_REDIS_URL=
# 환경 식별자
ENVIRONMENT_NAME=
# 환경 접속 URL
ENVIRONMENT_URL=
# 환경 프록시 접속 URL
ENVIRONMENT_PROXY_URL=
```

### Docker Compose 예시

다음 예시는 Docker 컨테이너를 실행 단위로 하는 다중 환경 혼합 배포 방안을 보여주며, Docker Compose를 통해 하나의 입구 애플리케이션과 두 개의 작업 애플리케이션을 동시에 배포합니다.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## 사용 설명서

애플리케이션의 기본 관리 작업은 공유 메모리 모드와 동일하므로 [공유 메모리 모드](./local.md)를 참고하십시오. 이 섹션에서는 주로 다중 환경 설정과 관련된 내용을 소개합니다.

### 환경 목록

배포 완료 후, 입구 애플리케이션의 「애플리케이션 관리자」 페이지로 들어가 「환경」 탭에서 등록된 작업 환경 목록을 확인할 수 있습니다. 여기에는 환경 식별자, 작업 애플리케이션 버전, 접속 URL 및 상태 등의 정보가 포함됩니다. 작업 애플리케이션은 환경의 가용성을 보장하기 위해 2분마다 한 번씩 하트비트(Heartbeat)를 보고합니다.

![](https://static-docs.nocobase.com/202512291830371.png)

### 애플리케이션 생성

애플리케이션을 생성할 때 하나 이상의 실행 환경을 선택하여 해당 애플리케이션이 어떤 작업 애플리케이션에 배포될지 지정할 수 있습니다. 일반적으로 하나의 환경만 선택하는 것을 권장합니다. 작업 애플리케이션에서 [서비스 분할](/cluster-mode/services-splitting)을 수행하여 부하 분산이나 기능 격리를 위해 동일한 애플리케이션을 여러 실행 환경에 배포해야 하는 경우에만 여러 환경을 선택하십시오.

![](https://static-docs.nocobase.com/202512291835086.png)

### 애플리케이션 목록

애플리케이션 목록 페이지에는 각 애플리케이션이 현재 위치한 실행 환경 및 상태 정보가 표시됩니다. 애플리케이션이 여러 환경에 배포된 경우 여러 실행 상태가 표시됩니다. 여러 환경의 동일한 애플리케이션은 정상적인 상황에서 통합된 상태를 유지하며, 시작과 중지를 통합적으로 제어해야 합니다.

![](https://static-docs.nocobase.com/202512291842216.png)

### 애플리케이션 시작

애플리케이션 시작 시 데이터베이스에 초기화 데이터를 기록할 수 있으므로, 다중 환경에서의 경합 상태(Race Condition)를 피하기 위해 여러 환경에 배포된 애플리케이션은 시작 시 순차적으로 대기하며 진행됩니다.

![](https://static-docs.nocobase.com/202512291841727.png)

### 애플리케이션 접속 프록시

작업 애플리케이션은 입구 애플리케이션의 하위 경로인 `/apps/:appName/admin`을 통해 프록시 접속이 가능합니다.

![](https://static-docs.nocobase.com/202601082154230.png)

애플리케이션이 여러 환경에 배포된 경우 프록시 접속을 위한 대상 환경을 지정해야 합니다.

![](https://static-docs.nocobase.com/202601082155146.png)

기본적으로 프록시 접속 주소는 작업 애플리케이션의 접속 주소를 사용하며, 이는 환경 변수 `ENVIRONMENT_URL`에 해당합니다. 이 주소가 입구 애플리케이션이 위치한 네트워크 환경에서 접근 가능한지 확인해야 합니다. 다른 프록시 접속 주소를 사용해야 하는 경우 환경 변수 `ENVIRONMENT_PROXY_URL`을 통해 덮어쓸 수 있습니다.