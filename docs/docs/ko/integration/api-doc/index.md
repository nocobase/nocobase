---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



# API 문서



## 소개

이 플러그인은 Swagger를 기반으로 NocoBase HTTP API 문서를 생성합니다.

## 설치

이 플러그인은 내장되어 있어 별도의 설치가 필요 없습니다. 활성화하여 바로 사용할 수 있습니다.

## 사용 방법

### API 문서 페이지 접속

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a50a0fb664a0.png)

### 문서 개요

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- 전체 API 문서: `/api/swagger:get`
- 코어 API 문서: `/api/swagger:get?ns=core`
- 모든 플러그인 API 문서: `/api/swagger:get?ns=plugins`
- 각 플러그인 문서: `/api/swagger:get?ns=plugins/{name}`
- 사용자 정의 컬렉션의 API 문서: `/api/swagger:get?ns=collections`
- 지정된 `${collection}` 및 관련 `${collection}.${association}` 리소스: `/api/swagger:get?ns=collections/{name}`

## 개발자 가이드

### 플러그인용 Swagger 문서 작성 방법

플러그인의 `src` 폴더에 `swagger/index.ts` 파일을 다음 내용으로 추가합니다:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

자세한 작성 규칙은 [Swagger 공식 문서](https://swagger.io/docs/specification/about/)를 참조해 주세요.