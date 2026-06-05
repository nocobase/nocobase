:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Git 소스 설치 업그레이드

:::warning 업그레이드 전 준비 사항

- 데이터베이스를 반드시 먼저 백업해 주세요.
- 실행 중인 NocoBase를 중지해 주세요. (`Ctrl + C`)

:::

## 1. NocoBase 프로젝트 디렉토리로 이동

```bash
cd my-nocobase-app
```

## 2. 최신 코드 가져오기

```bash
git pull
```

## 3. 캐시 및 이전 의존성 삭제 (선택 사항)

정상적인 업그레이드 과정이 실패할 경우, 캐시와 의존성을 비운 후 다시 다운로드해 볼 수 있습니다.

```bash
# NocoBase 캐시 삭제
yarn nocobase clean
# 의존성 삭제
yarn rimraf -rf node_modules # rm -rf node_modules 와 동일합니다.
```

## 4. 의존성 업데이트

📢 네트워크 환경, 시스템 설정 등의 요인으로 인해 다음 단계는 10분 이상 소요될 수 있습니다.

```bash
yarn install
```

## 5. 업그레이드 명령 실행

```bash
yarn nocobase upgrade
```

## 6. NocoBase 시작

```bash
yarn dev
```

:::tip 프로덕션 환경 팁

소스 코드로 설치된 NocoBase를 프로덕션 환경에 직접 배포하는 것은 권장하지 않습니다. (프로덕션 환경에 대한 자세한 내용은 [프로덕션 배포](../deployment/production.md)를 참조해 주세요.)

:::

## 7. 서드파티 플러그인 업그레이드

[플러그인 설치 및 업그레이드](../install-upgrade-plugins.mdx)를 참조해 주세요.