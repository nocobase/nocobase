---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

NocoBase MCP Server 플러그인을 활성화하면 NocoBase 애플리케이션은 MCP 클라이언트가 NocoBase API에 접근하고 호출할 수 있는 MCP 엔드포인트를 제공합니다.

## 서버 주소

- main 앱:

  `http(s)://<host>:<port>/api/mcp`

- main 앱이 아닌 경우:

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

이 엔드포인트는 `streamable HTTP` 전송 방식을 사용합니다.

`x-mcp-packages` 요청 헤더를 사용해 MCP가 노출할 패키지 API를 제어할 수 있습니다. 예:

`x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users`

이 헤더에는 전체 패키지 이름을 전달할 수 있습니다. scope가 없으면 자동으로 `@nocobase/`가 추가됩니다. 기본적으로 MCP는 다음 패키지 API를 로드합니다.

- `@nocobase/plugin-data-source-main`
- `@nocobase/plugin-data-source-manager`
- `@nocobase/plugin-workflow*`
- `@nocobase/plugin-acl`
- `@nocobase/plugin-users`
- `@nocobase/plugin-auth`
- `@nocobase/plugin-client`
- `@nocobase/plugin-flow-engine`
- `@nocobase/plugin-ai`

## 제공 기능

- NocoBase 코어 및 각종 플러그인 API
- 데이터 테이블을 다루기 위한 범용 CRUD 도구

## 빠른 시작

### Codex

#### API Key 인증 사용

먼저 API Keys 플러그인을 활성화하고 API Key를 생성하세요.

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### OAuth 인증 사용

먼저 IdP: OAuth 플러그인을 활성화하세요.

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### API Key 인증 사용

먼저 API Keys 플러그인을 활성화하고 API Key를 생성하세요.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### OAuth 인증 사용

먼저 IdP: OAuth 플러그인을 활성화하세요.

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

명령을 실행한 뒤 Claude를 열고 해당 MCP 서비스에 로그인하세요.

```bash
claude
/mcp
```

## Skills와 함께 사용하기

NocoBase MCP는 NocoBase Skills와 함께 사용하는 것을 권장합니다. 자세한 내용은 [NocoBase Skills](../skills/index.md)를 참고하세요.
