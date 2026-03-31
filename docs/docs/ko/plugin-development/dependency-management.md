:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 의존성 관리

NocoBase 플러그인 개발에서 의존성은 크게 **플러그인 의존성**과 **전역 의존성** 두 가지로 나뉩니다.

-   **전역 의존성**: `@nocobase/server` 및 `@nocobase/client`에서 제공하므로, 플러그인에서 별도로 번들링할 필요가 없습니다.
-   **플러그인 의존성**: 플러그인 고유의 의존성(서버 측 의존성 포함)으로, 플러그인 결과물에 함께 번들링됩니다.

## 개발 원칙

플러그인 의존성(서버 의존성 포함)은 `dist/node_modules`에 번들링되어 플러그인 결과물에 포함됩니다. 따라서 플러그인 개발 시 모든 의존성을 `dependencies` 대신 `devDependencies`에 선언하는 것이 좋습니다. 이렇게 하면 개발 환경과 프로덕션 환경 간의 차이를 방지할 수 있습니다.

플러그인에서 다음 의존성을 설치해야 할 경우, **버전 번호**가 전역 의존성인 `@nocobase/server` 및 `@nocobase/client`와 일치하는지 확인해야 합니다. 그렇지 않으면 런타임 충돌이 발생할 수 있습니다.

## 전역 의존성

다음 의존성은 NocoBase에서 제공하므로 플러그인에서 번들링할 필요가 없습니다. 만약 필요하다면 프레임워크 버전과 일치시켜야 합니다.

``` js
// nocobase 핵심
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client',
'@nocobase/database',
'@nocobase/evaluators',
'@nocobase/logger',
'@nocobase/resourcer',
'@nocobase/sdk',
'@nocobase/server',
'@nocobase/test',
'@nocobase/utils',

// @nocobase/auth
'jsonwebtoken',

// @nocobase/cache
'cache-manager',
'cache-manager-fs-hash',

// @nocobase/database
'sequelize',
'umzug',
'async-mutex',

// @nocobase/evaluators
'@formulajs/formulajs',
'mathjs',

// @nocobase/logger
'winston',
'winston-daily-rotate-file',

// koa 생태
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React 생태
'react',
'react-dom',
'react/jsx-runtime',

// React Router
'react-router',
'react-router-dom',

// Ant Design
'antd',
'antd-style',
'@ant-design/icons',
'@ant-design/cssinjs',

// i18n
'i18next',
'react-i18next',

// dnd-kit
'@dnd-kit/accessibility',
'@dnd-kit/core',
'@dnd-kit/modifiers',
'@dnd-kit/sortable',
'@dnd-kit/utilities',

// Formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// 범용 유틸리티
'dayjs',
'mysql2',
'pg',
'pg-hstore',
'supertest',
'axios',
'@emotion/css',
'ahooks',
'lodash',
```

## 개발 권장 사항

1.  **의존성 일관성 유지**
    전역 의존성에 이미 존재하는 패키지를 사용해야 하는 경우, 다른 버전을 설치하지 말고 전역 의존성을 직접 사용하세요.

2.  **번들 크기 최소화**
    `antd`와 같은 일반적인 UI 라이브러리, `lodash`와 같은 유틸리티 라이브러리, `pg`, `mysql2`와 같은 데이터베이스 드라이버의 경우, 전역으로 제공되는 버전에 의존하여 중복 번들링을 피해야 합니다.

3.  **디버그 및 프로덕션 환경 일관성 유지**
    `devDependencies`를 사용하면 개발 환경과 최종 결과물 간의 일관성을 보장하여, `dependencies` 및 `peerDependencies`의 잘못된 설정으로 인한 환경 차이를 방지할 수 있습니다.