---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# API 키

## 소개

## 사용 방법

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API 키 추가

![](https://static-docs.nocobase.com/461872fc0ad9a96fa5b14e97fcba12.png)

**주의 사항**

- 추가되는 API 키는 현재 사용자를 위한 것이며, 해당 사용자의 역할을 따릅니다.
- `APP_KEY` 환경 변수가 설정되어 있고 유출되지 않도록 주의해야 합니다. `APP_KEY`가 변경되면 이전에 추가된 모든 API 키가 무효화됩니다.

### APP_KEY 설정 방법

Docker 버전을 사용하시는 경우, `docker-compose.yml` 파일을 수정합니다.

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

소스 코드 또는 `create-nocobase-app`으로 설치한 경우, `.env` 파일에서 `APP_KEY`를 직접 수정하면 됩니다.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```