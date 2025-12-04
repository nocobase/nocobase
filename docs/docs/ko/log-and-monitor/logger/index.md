---
pkg: "@nocobase/plugin-logger"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



pkg: '@nocobase/plugin-logger'
---

# 로그

## 소개

로그는 시스템 문제를 파악하는 데 중요한 수단입니다. NocoBase의 서버 로그는 주로 인터페이스 요청 로그와 시스템 운영 로그를 포함하며, 로그 레벨, 롤링 전략, 크기, 출력 형식 등 다양한 설정을 지원합니다. 이 문서에서는 NocoBase 서버 로그에 대한 내용과, 로그 플러그인에서 제공하는 서버 로그 패키징 및 다운로드 기능을 사용하는 방법을 주로 설명합니다.

## 로그 설정

[환경 변수](/get-started/installation/env.md#logger_transport)를 통해 로그 레벨, 출력 방식, 출력 형식 등 로그 관련 파라미터를 설정할 수 있습니다.

## 로그 형식

NocoBase는 4가지 다른 로그 형식을 설정할 수 있도록 지원합니다.

### `console`

개발 환경의 기본 형식으로, 메시지가 강조 색상으로 표시됩니다.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

프로덕션 환경의 기본 형식입니다.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

구분자 `|`로 분리됩니다.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## 로그 디렉터리

NocoBase 로그 파일의 주요 디렉터리 구조는 다음과 같습니다.

- `storage/logs` - 로그 출력 디렉터리
  - `main` - 메인 애플리케이션 이름
    - `request_YYYY-MM-DD.log` - 요청 로그
    - `system_YYYY-MM-DD.log` - 시스템 로그
    - `system_error_YYYY-MM-DD.log` - 시스템 오류 로그
    - `sql_YYYY-MM-DD.log` - SQL 실행 로그
    - ...
  - `sub-app` - 서브 애플리케이션 이름
    - `request_YYYY-MM-DD.log`
    - ...

## 로그 파일

### 요청 로그

`request_YYYY-MM-DD.log`는 인터페이스 요청 및 응답 로그입니다.

| 필드          | 설명                               |
| ------------- | ---------------------------------- |
| `level`       | 로그 레벨                          |
| `timestamp`   | 로그 출력 시간 `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` 또는 `response`          |
| `userId`      | `response`에만 해당                |
| `method`      | 요청 메서드                        |
| `path`        | 요청 경로                          |
| `req` / `res` | 요청/응답 내용                     |
| `action`      | 요청 리소스 및 파라미터            |
| `status`      | 응답 상태 코드                     |
| `cost`        | 요청 처리 시간                     |
| `app`         | 현재 애플리케이션 이름             |
| `reqId`       | 요청 ID                            |

:::info{title=참고}
`reqId`는 `X-Request-Id` 응답 헤더를 통해 프런트엔드로 전달됩니다.
:::

### 시스템 로그

`system_YYYY-MM-DD.log`는 애플리케이션, 미들웨어, 플러그인 등 시스템 운영 로그이며, `error` 레벨 로그는 `system_error_YYYY-MM-DD.log`에 별도로 출력됩니다.

| 필드        | 설명                               |
| ----------- | ---------------------------------- |
| `level`     | 로그 레벨                          |
| `timestamp` | 로그 출력 시간 `YYYY-MM-DD hh:mm:ss` |
| `message`   | 로그 메시지                        |
| `module`    | 모듈                               |
| `submodule` | 서브 모듈                          |
| `method`    | 호출 메서드                        |
| `meta`      | 기타 관련 정보 (JSON 형식)         |
| `app`       | 현재 애플리케이션 이름             |
| `reqId`     | 요청 ID                            |

### SQL 실행 로그

`sql_YYYY-MM-DD.log`는 데이터베이스 SQL 실행 로그입니다. `INSERT INTO` 문은 처음 2000자까지만 유지됩니다.

| 필드        | 설명                               |
| ----------- | ---------------------------------- |
| `level`     | 로그 레벨                          |
| `timestamp` | 로그 출력 시간 `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL 문                             |
| `app`       | 현재 애플리케이션 이름             |
| `reqId`     | 요청 ID                            |

## 로그 패키징 및 다운로드

1. 로그 관리 페이지로 이동합니다.
2. 다운로드하려는 로그 파일을 선택합니다.
3. 다운로드 (Download) 버튼을 클릭합니다.

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## 관련 문서

- [플러그인 개발 - 서버 - 로그](/plugin-development/server/logger)
- [API 참조 - @nocobase/logger](/api/logger/logger)