:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Docker 설치 업그레이드

:::warning 업그레이드 전 준비사항

- 데이터베이스를 반드시 먼저 백업해 주세요.

:::

## 1. docker-compose.yml 파일이 있는 디렉터리로 이동합니다.

예시:

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. 이미지 버전 번호 업데이트

:::tip 버전 번호 안내

- `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`와 같은 별칭 버전은 일반적으로 수정할 필요가 없습니다.
- `1.7.14`, `1.7.14-full`와 같은 숫자 버전은 목표 버전 번호로 변경해야 합니다.
- 버전은 업그레이드만 지원하며, 다운그레이드는 지원하지 않습니다!!!
- 프로덕션 환경에서는 의도치 않은 자동 업그레이드를 방지하기 위해 특정 숫자 버전으로 고정하는 것을 권장합니다. [모든 버전 보기](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # 알리윈(Aliyun) 미러 사용을 권장합니다 (중국 내 네트워크 안정성 향상).
    image: nocobase/nocobase:1.7.14-full
    # 별칭 버전도 사용할 수 있습니다 (자동 업그레이드될 수 있으므로 프로덕션 환경에서는 주의해서 사용하세요).
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (중국 내에서는 느리거나 실패할 수 있습니다)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. 컨테이너 재시작

```bash
# 최신 이미지 가져오기
docker compose pull app

# 컨테이너 재구축
docker compose up -d app

# app 프로세스 상태 확인
docker compose logs -f app
```

## 4. 타사 플러그인 업그레이드

[플러그인 설치 및 업그레이드](../install-upgrade-plugins.mdx)를 참고해 주세요.

## 5. 롤백 안내

NocoBase는 다운그레이드를 지원하지 않습니다. 롤백이 필요한 경우, 업그레이드 전 데이터베이스 백업을 복원하고 이미지 버전을 원래 버전으로 되돌려야 합니다.

## 6. 자주 묻는 질문 (FAQ)

**Q: 이미지 가져오기(pull)가 느리거나 실패합니다.**

미러 가속기를 사용하거나, 알리윈(Aliyun) 미러 `nocobase/nocobase:<tag>`를 사용해 보세요.

**Q: 버전이 변경되지 않았습니다.**

`image`를 새 버전 번호로 변경하고 `docker compose pull app` 및 `up -d app` 명령을 성공적으로 실행했는지 확인해 주세요.

**Q: 상업용 플러그인 다운로드 또는 업데이트에 실패했습니다.**

상업용 플러그인의 경우, 시스템에서 라이선스 키를 확인하고 Docker 컨테이너를 재시작해 주세요. 자세한 내용은 [NocoBase 상업용 라이선스 활성화 가이드](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)를 참조하세요.