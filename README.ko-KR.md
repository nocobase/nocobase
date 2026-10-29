# NocoBase 3

> 이 브랜치는 NocoBase 3입니다. NocoBase 2 노코드 개발 플랫폼을 찾으신다면 [NocoBase 2](https://nocode.nocobase.com/)를 방문하세요.

[English](./README.md) | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | 한국어

**신뢰할 수 있는 비즈니스 시스템 구축**

NocoBase는 AI로 비즈니스 시스템을 지속적으로 개발하고 운영하는 오픈소스 플랫폼입니다.에이전트는 코드를 작성하고 실행하며, NocoBase는 기반과 거버넌스를 제공하고, 결정은 사람이 내립니다.

[▶ 데모 보기](https://static-docs.nocobase.com/nocobase-3-ko.mp4)

[공식 사이트](https://www.nocobase.com/ko-KR/) · [문서](https://docs.nocobase.com/) · [빠른 시작](#quick-start) · [커뮤니티](https://forum.nocobase.com/)

## 왜 NocoBase인가

**AI는 코드를 빠르게 작성합니다. 하지만 신뢰할 수 있는 비즈니스 시스템을 만드는 일은 여전히 쉽지 않습니다.**

이미 AI로 개발하거나 바이브 코딩을 하고 있다면 코드는 빠르게 나옵니다. 하지만 새로운 문제가 함께 생깁니다.

- **기반을 처음부터 만들어야 한다**

  AI에 맡겨도 권한, 워크플로 엔진, 승인 같은 기반 모듈을 처음부터 개발하면 설계가 어렵고, 예외 상황이 많고, 유지 보수 부담도 큽니다.

- **아키텍처가 제멋대로 흔들리고 통제를 벗어난다**

  사람이나 모델, 심지어 세션만 바뀌어도 AI는 매번 다르게 구현할 수 있습니다. 시스템은 점점 유지 보수하기 어려워집니다.

- **병렬 작업이 넘쳐 사람이 확인하지 못한다**

  여러 프로젝트와 작업을 동시에 맡아 여러 터미널과 대화창을 오가는 동안, 에이전트가 넘기는 변경은 계속 늘어납니다. 다 볼 수도 없고, 그렇다고 손을 놓을 수도 없습니다.

- **지식과 경험이 쌓이지도, 공유되지도 않는다**

  요구 사항의 배경, 업무 자료, 프로젝트 경험이 여러 컴퓨터의 여러 대화에 흩어져 있어, 사람이나 에이전트가 바뀌면 찾기 어렵습니다.

<a id="quick-start"></a>

## 빠른 시작

Node.js 24 이상과 pnpm 11이 필요합니다. Windows에서는 WSL을 사용하세요. 아래 예제는 SQLite를 사용하므로 별도의 데이터베이스 서버가 필요하지 않습니다.

### 코딩 에이전트 사용

빈 디렉터리에서 Skills를 지원하는 코딩 에이전트를 열고 앱 생성 Skill을 설치하세요.

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

설치 시 사용하는 에이전트를 선택하세요. 새 Skill이 인식되지 않으면 새 세션을 시작하세요. 그런 다음 아래 요청을 보내세요.

```text
nocobase-create-app Skill에 따라 현재 빈 디렉터리에 기본 템플릿과 SQLite를 사용하여 NocoBase 3 앱을 만들고 실행해 주세요.
```

### 터미널 사용

프로젝트를 보관하는 상위 디렉터리에서 다음 명령을 실행하세요.

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

자세한 설정 방법과 개발 가이드는 [문서](https://docs.nocobase.com/)를 참고하세요.

## NocoBase 생태계

- **[NocoBase Core](https://www.nocobase.com/ko-KR/core/)**

  **에이전트는 비즈니스 개발에만 집중하세요. 기반은 이미 준비되어 있습니다.**

  NocoBase Core는 AI로 비즈니스 시스템을 개발하고 운영하는 오픈소스 애플리케이션 기반입니다. 권한, 워크플로, 파일 같은 기본 기능을 바로 사용할 수 있어, 에이전트는 통일된 아키텍처 위에서 기업 고유의 비즈니스만 개발합니다.

- **[NocoBase Studio](https://www.nocobase.com/ko-KR/studio/)**

  **에이전트는 스스로 추진하고, 팀은 전체를 장악한다.**

  NocoBase Studio는 사람과 에이전트가 함께 개발하는 거버넌스 플랫폼입니다. Claude Code, Codex, OpenCode를 하나의 에이전트 팀으로 묶어 작업을 스스로 진행합니다. 진행 상황은 한눈에 보이고, 중요한 결정은 사람이 내립니다.

- **[NocoBase Solution](https://www.nocobase.com/ko-KR/solutions/)**

  **오픈소스 비즈니스 앱. AI 기반으로, 설치 즉시 사용.**

  NocoBase Solution은 Core 위에 구축된, 에이전트가 움직이는 비즈니스 앱 시리즈입니다. 실행 업무의 대부분은 에이전트가 맡고, 사람은 중요한 결정만 내립니다.

## 커뮤니티 및 기여

- [커뮤니티 포럼](https://forum.nocobase.com/)에서 질문하고 경험을 공유하세요.
- 재현 가능한 버그를 보고하거나 개선 사항을 제안하려면 [GitHub Issues](https://github.com/nocobase/nocobase/issues)를 이용하세요.
- 프레임워크와 플러그인에 대해 알아보려면 [문서](https://docs.nocobase.com/)를 읽어 보세요.

기여를 환영합니다. 이 저장소를 수정하기 전에 [AGENTS.md](./AGENTS.md)와 변경 사항에 관련된 개발 지침을 읽어 주세요.
