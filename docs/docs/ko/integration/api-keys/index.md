:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# API 키

## 소개

## 설치

## 사용 방법

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API 키 추가

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**참고 사항**

- 추가하는 API 키는 현재 사용자에게 귀속되며, 현재 사용자의 역할을 상속받습니다.
- `APP_KEY` 환경 변수가 올바르게 설정되어 있고 유출되지 않도록 주의해 주세요. 만약 `APP_KEY`가 변경되면, 이전에 추가된 모든 API 키는 더 이상 유효하지 않게 됩니다.

### APP_KEY 설정 방법

Docker 버전을 사용하시는 경우, `docker-compose.yml` 파일을 수정해 주세요.

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

소스 코드 또는 `create-nocobase-app`으로 설치하신 경우, `.env` 파일의 `APP_KEY`를 직접 수정하시면 됩니다.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```