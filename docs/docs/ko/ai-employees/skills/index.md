# NocoBase Skills

> [!WARNING]
> NocoBase Skills는 아직 초안 단계에 있습니다. 이 문서는 참고용이며 언제든 변경될 수 있습니다.

[NocoBase Skills](https://github.com/nocobase/skills)는 Codex, Claude Code, OpenCode 같은 coding agent CLI를 위한 재사용 가능한 Skills 모음을 제공하며, 설치, 데이터 모델링, UI 구축, 워크플로 구성 작업을 더 효율적으로 진행할 수 있도록 도와줍니다.

## 설치

1. Codex, Claude Code, OpenCode 등 coding agent CLI를 설치합니다.

2. [skills.sh](https://skills.sh/)를 통해 Skills를 설치합니다.

이 저장소의 NocoBase Skills 전체를 설치합니다.

```bash
mkdir nocobase-app-builder && cd nocobase-app-builder
npx skills add nocobase/skills
```

## 권장 사용 흐름

1. 아직 설치하지 않았다면 NocoBase를 설치합니다.

agent에게 직접 요청할 수도 있습니다.

```text
Install and start NocoBase.
```

2. NocoBase MCP Server를 설정합니다.

연결 설정도 agent에게 맡길 수 있습니다.

```text
Set up NocoBase MCP connection.
```

수동으로 설정하려면 [NocoBase MCP](../mcp/index.md)를 참고하세요.

3. 데이터 모델링과 애플리케이션 구축을 시작합니다.

예를 들어 agent에게 이렇게 말할 수 있습니다.

```text
I am building a CRM, design and create collections.
```

MCP 연결이 완료되면 대부분의 NocoBase API를 MCP tools를 통해 사용할 수 있습니다.
