:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 고급

## 소개

주요 대규모 언어 모델(LLM)은 도구를 사용하는 능력을 가지고 있습니다. AI 직원 플러그인에는 LLM이 사용할 수 있는 몇 가지 일반적인 도구가 내장되어 있습니다. AI 직원 설정 페이지에서 설정하는 스킬은 LLM이 활용할 수 있는 도구입니다.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## 스킬 설정

AI 직원 플러그인 설정 페이지로 이동하여 `AI employees` 탭을 클릭하면 AI 직원 관리 페이지로 들어갑니다. 스킬을 설정할 AI 직원을 선택하고 `Edit` 버튼을 클릭하여 AI 직원 편집 페이지로 이동합니다. `Skills` 탭에서 `Add Skill` 버튼을 클릭하여 현재 AI 직원에게 스킬을 추가합니다.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## 스킬 소개

### Frontend

Frontend 그룹은 AI 직원이 프런트엔드 컴포넌트와 상호작용할 수 있도록 합니다.

- `Form filler` 스킬을 통해 AI 직원은 생성된 폼 데이터를 사용자가 지정한 폼에 다시 채워 넣을 수 있습니다.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling

Data modeling 그룹 스킬은 AI 직원이 NocoBase 내부 API를 호출하여 데이터 모델링을 수행할 수 있는 기능을 제공합니다.

- `Intent Router`는 사용자가 컬렉션 구조를 수정하려는 것인지, 아니면 새로운 컬렉션 구조를 생성하려는 것인지 의도를 판단하여 라우팅합니다.
- `Get collection names`은 시스템 내에 존재하는 모든 컬렉션의 이름을 가져옵니다.
- `Get collection metadata`은 지정된 컬렉션의 구조 정보를 가져옵니다.
- `Define collections`을 통해 AI 직원은 시스템에서 컬렉션을 생성할 수 있습니다.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller`는 AI 직원이 워크플로우를 실행할 수 있는 기능을 제공합니다. 워크플로우 플러그인에서 `Trigger type`이 `AI employee event`로 설정된 워크플로우는 AI 직원이 사용할 수 있는 스킬로 여기에 제공됩니다.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Code Editor 그룹의 스킬은 주로 AI 직원이 코드 편집기와 상호작용할 수 있도록 합니다.

- `Get code snippet list`는 미리 설정된 코드 스니펫 목록을 가져옵니다.
- `Get code snippet content`는 지정된 코드 스니펫의 내용을 가져옵니다.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Others

- `Chart generator`는 AI 직원이 차트를 생성하고 대화 중에 직접 출력할 수 있는 기능을 제공합니다.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)