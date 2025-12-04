:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# RAG 검색

## 소개

지식 베이스를 구성한 후 AI 직원 설정에서 RAG 기능을 활성화할 수 있습니다.

RAG가 활성화되면 사용자가 AI 직원과 대화할 때 AI 직원은 RAG 검색을 사용하여 사용자의 메시지를 기반으로 지식 베이스에서 문서를 가져오고 검색된 문서를 기반으로 응답합니다.

## RAG 활성화

AI 직원 플러그인 구성 페이지로 이동하여 `AI employees` 탭을 클릭하여 AI 직원 관리 페이지로 들어갑니다.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

RAG를 활성화할 AI 직원을 선택하고 `Edit` 버튼을 클릭하여 AI 직원 편집 페이지로 들어갑니다.

`Knowledge base` 탭에서 `Enable` 스위치를 켭니다.

- `Knowledge Base Prompt`에 지식 베이스를 참조하기 위한 프롬프트를 입력합니다. `{knowledgeBaseData}`는 고정된 자리 표시자이므로 수정하지 마십시오.
- `Knowledge Base`에서 구성된 지식 베이스를 선택합니다. [지식 베이스](/ai-employees/knowledge-base/knowledge-base)를 참조하십시오.
- `Top K` 입력 상자에 검색할 문서 수를 입력합니다. 기본값은 3개입니다.
- `Score` 입력 상자에 검색 시 문서 관련성 임계값을 입력합니다.

`Submit` 버튼을 클릭하여 AI 직원 설정을 저장합니다.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)