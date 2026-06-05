---
pkg: '@nocobase/plugin-app-supervisor'
---

# 멀티 환경 모드

## 소개

공유 메모리 모드가 안정성/격리/확장 요구를 충족하기 어려운 경우 멀티 환경 하이브리드 배포를 사용합니다.

## 배포

- **Supervisor**: 앱/환경 통합 관리
- **Worker**: 실제 앱 실행
- **Redis**: 설정 캐시 및 명령 통신

환경 생성 기능은 아직 자동 제공되지 않으며 Worker는 수동 배포/설정이 필요합니다.

### Supervisor 환경 변수

```bash
APP_MODE=supervisor
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=remote
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
```

### Worker 환경 변수

```bash
APP_MODE=worker
APP_DISCOVERY_ADAPTER=remote
APP_PROCESS_ADAPTER=local
APP_SUPERVISOR_REDIS_URL=
APP_COMMAND_ADPATER=redis
APP_COMMAND_REDIS_URL=
ENVIRONMENT_NAME=
ENVIRONMENT_URL=
ENVIRONMENT_PROXY_URL=
```

### Docker Compose 예시

```yaml
services:
  redis:
    image: redis/redis-stack-server:latest
  supervisor:
    image: nocobase/nocobase:alpha
    environment:
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
```

## 사용

기본 앱 관리는 [공유 메모리 모드](./local.md)와 동일합니다.

- **Environment** 탭에서 등록된 환경 확인
- 앱 생성 시 실행 환경 선택
- 다중 환경 시작 시 큐 처리
- `/apps/:appName/admin` 프록시 접속

![](https://static-docs.nocobase.com/202512291830371.png)
![](https://static-docs.nocobase.com/202512291835086.png)
![](https://static-docs.nocobase.com/202512291842216.png)
![](https://static-docs.nocobase.com/202512291841727.png)
![](https://static-docs.nocobase.com/202601082154230.png)
![](https://static-docs.nocobase.com/202601082155146.png)
