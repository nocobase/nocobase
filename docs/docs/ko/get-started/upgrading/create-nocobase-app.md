:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# create-nocobase-app 설치 업그레이드

:::warning 업그레이드 전 준비 사항

- 데이터베이스를 반드시 백업해 주세요.
- 실행 중인 NocoBase 인스턴스를 중지해 주세요.

:::

## 1. 실행 중인 NocoBase 중지

백그라운드에서 실행 중인 프로세스가 아니라면 `Ctrl + C`를 눌러 중지합니다. 프로덕션 환경에서는 `pm2-stop` 명령을 실행하여 중지해 주세요.

```bash
yarn nocobase pm2-stop
```

## 2. 업그레이드 명령 실행

`yarn nocobase upgrade` 명령을 실행해 주세요.

```bash
# 해당 디렉터리로 이동
cd my-nocobase-app
# 업데이트 명령 실행
yarn nocobase upgrade
# 시작
yarn dev
```

### 특정 버전으로 업그레이드

프로젝트 루트 디렉터리에 있는 `package.json` 파일을 수정하여 `@nocobase/cli` 및 `@nocobase/devtools`의 버전 번호를 변경해 주세요. (다운그레이드는 불가능하며, 업그레이드만 가능합니다.) 예시는 다음과 같습니다:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

그다음 업그레이드 명령을 실행해 주세요.

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```