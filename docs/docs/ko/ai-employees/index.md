---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/ai-employees/index)을 참조하세요.
:::

# 개요

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI 직원(`AI Employees`)은 NocoBase 비즈니스 시스템에 깊이 통합된 지능형 에이전트 기능입니다.

단순히 "대화만 가능한" 로봇이 아니라, 비즈니스 인터페이스 내에서 컨텍스트를 이해하고 작업을 직접 수행할 수 있는 "디지털 동료"입니다:

- **비즈니스 컨텍스트 이해**: 현재 페이지, 블록, 데이터 구조 및 선택된 내용을 인식합니다.
- **직접 작업 수행**: 기술을 호출하여 조회, 분석, 작성, 설정, 생성 등의 작업을 완료할 수 있습니다.
- **역할 기반 협업**: 직무에 따라 서로 다른 직원을 구성하고, 대화 중에 모델을 전환하여 협업할 수 있습니다.

## 5분 시작 가이드

먼저 [빠른 시작](/ai-employees/quick-start)을 확인하고, 다음 순서에 따라 최소 가용 구성을 완료하십시오:

1. 최소 하나 이상의 [LLM 서비스](/ai-employees/features/llm-service)를 구성합니다.
2. 최소 하나 이상의 [AI 직원](/ai-employees/features/enable-ai-employee)을 활성화합니다.
3. 대화를 열고 [AI 직원과 협업](/ai-employees/features/collaborate)을 시작합니다.
4. 필요에 따라 [인터넷 검색](/ai-employees/features/web-search) 및 [바로가기 작업](/ai-employees/features/task)을 활성화합니다.

## 기능 맵

### A. 기본 설정 (관리자)

- [LLM 서비스 구성](/ai-employees/features/llm-service): Provider를 연결하고 사용 가능한 모델을 구성 및 관리합니다.
- [AI 직원 활성화](/ai-employees/features/enable-ai-employee): 내장된 직원을 활성화/비활성화하고 사용 범위를 제어합니다.
- [새 AI 직원 생성](/ai-employees/features/new-ai-employees): 역할, 페르소나(Role setting), 환영 인사 및 능력 범위를 정의합니다.
- [기술 사용](/ai-employees/features/tool): 기술 권한(`Ask` / `Allow`)을 설정하여 실행 리스크를 제어합니다.

### B. 일상 협업 (비즈니스 사용자)

- [AI 직원과 협업](/ai-employees/features/collaborate): 대화 내에서 직원과 모델을 전환하며 지속적으로 협업합니다.
- [컨텍스트 추가 - 블록](/ai-employees/features/pick-block): 페이지 블록을 컨텍스트로 AI에게 전송합니다.
- [바로가기 작업](/ai-employees/features/task): 페이지/블록에 자주 사용하는 작업을 미리 설정하여 클릭 한 번으로 실행합니다.
- [인터넷 검색](/ai-employees/features/web-search): 최신 정보가 필요할 때 검색 증강 답변을 활성화합니다.

### C. 심화 기능 (확장)

- [내장 AI 직원](/ai-employees/features/built-in-employee): 사전 설정된 직원의 역할과 적용 시나리오를 파악합니다.
- [권한 제어](/ai-employees/permission): 조직 권한 모델에 따라 직원, 기술 및 데이터 접근을 제어합니다.
- [AI 지식창고](/ai-employees/knowledge-base/index): 기업 지식을 도입하여 답변의 안정성과 추적 가능성을 높입니다.
- [워크플로우 LLM 노드](/ai-employees/workflow/nodes/llm/chat): AI 능력을 자동화 프로세스에 배치합니다.

## 핵심 개념 (사전 통일 권장)

다음 용어들은 용어집과 일치하며, 팀 내에서 통일하여 사용하는 것을 권장합니다:

- **AI 직원 (AI Employee)**: 페르소나(Role setting)와 기술(Tool / Skill)로 구성된 실행 가능한 지능형 에이전트입니다.
- **LLM 서비스 (LLM Service)**: 모델 연결 및 기능 설정 단위로, Provider와 모델 목록을 관리하는 데 사용됩니다.
- **제공자 (Provider)**: LLM 서비스 뒤에 있는 모델 공급처입니다.
- **활성화된 모델 (Enabled Models)**: 현재 LLM 서비스에서 대화 중 선택할 수 있도록 허용된 모델 집합입니다.
- **AI 직원 전환기 (AI Employee Switcher)**: 대화 내에서 현재 협업 중인 직원을 전환합니다.
- **모델 전환기 (Model Switcher)**: 대화 내에서 모델을 전환하며, 직원별로 선호도를 기억합니다.
- **기술 (Tool / Skill)**: AI가 호출할 수 있는 실행 기능 단위입니다.
- **기술 권한 (Permission: Ask / Allow)**: 기술 호출 전 사용자 확인이 필요한지 여부입니다.
- **컨텍스트 (Context)**: 페이지, 블록, 데이터 구조 등 비즈니스 환경 정보입니다.
- **대화 (Chat)**: 사용자와 AI 직원 간의 연속적인 상호작용 과정입니다.
- **인터넷 검색 (Web Search)**: 외부 검색을 기반으로 실시간 정보를 보완하는 능력입니다.
- **지식창고 (Knowledge Base / RAG)**: 검색 증강 생성을 통해 기업 지식을 도입합니다.
- **벡터 저장소 (Vector Store)**: 지식창고에 시맨틱 검색 능력을 제공하는 벡터화된 저장소입니다.

## 설치 안내

AI 직원은 NocoBase 내장 플러그인(`@nocobase/plugin-ai`)으로, 별도의 설치 없이 바로 사용할 수 있습니다.