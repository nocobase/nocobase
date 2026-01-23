:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 프로덕션 환경 배포

NocoBase를 프로덕션 환경에 배포할 때, 다양한 시스템 및 환경의 빌드 방식 차이로 인해 의존성 설치가 번거로울 수 있습니다. 모든 기능을 온전히 사용하려면 **Docker**를 사용하여 배포하는 것을 권장합니다. 시스템 환경에서 Docker를 사용할 수 없는 경우, **create-nocobase-app**을 사용하여 배포할 수도 있습니다.

:::warning

프로덕션 환경에서 소스 코드를 직접 배포하는 것은 권장하지 않습니다. 소스 코드는 많은 의존성을 가지며 용량이 크고, 전체 컴파일 시 CPU 및 메모리 요구 사항이 높습니다. 만약 소스 코드로 배포해야 한다면, 먼저 사용자 지정 Docker 이미지를 빌드한 다음 배포하는 것을 권장합니다.

:::

## 배포 프로세스

프로덕션 환경 배포는 기존 설치 및 업그레이드 단계를 참고할 수 있습니다.

### 신규 설치

- [Docker 설치](../installation/docker.mdx)
- [create-nocobase-app 설치](../installation/create-nocobase-app.mdx)

### 애플리케이션 업그레이드

- [Docker 설치 업그레이드](../installation/docker.mdx)
- [create-nocobase-app 설치 업그레이드](../installation/create-nocobase-app.mdx)

### 서드파티 플러그인 설치 및 업그레이드

- [플러그인 설치 및 업그레이드](../install-upgrade-plugins.mdx)

## 정적 리소스 프록시

프로덕션 환경에서는 정적 리소스를 프록시 서버를 통해 관리하는 것을 권장합니다. 예를 들어:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## 자주 사용하는 운영 명령

설치 방식에 따라 다음 명령을 사용하여 NocoBase 프로세스를 관리할 수 있습니다.

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)