:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 벡터 스토어

## 소개

지식 기반에서는 문서를 저장할 때 문서를 벡터화하고, 문서를 검색할 때 검색어를 벡터화합니다. 이 두 과정 모두 원본 텍스트를 벡터화하기 위해 `Embedding model`을 사용해야 합니다.

AI 지식 기반 플러그인에서 벡터 스토어는 `Embedding model`과 벡터 데이터베이스를 연결한 것입니다.

## 벡터 스토어 관리

AI 직원 플러그인 설정 페이지로 이동하여 `Vector store` 탭을 클릭하고, `Vector store`를 선택하면 벡터 스토어 관리 페이지로 이동합니다.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

오른쪽 상단의 `Add new` 버튼을 클릭하여 새로운 벡터 스토어를 추가합니다.

- `Name` 입력란에 벡터 스토어 이름을 입력합니다.
- `Vector store`에서 이미 설정된 벡터 데이터베이스를 선택합니다. 자세한 내용은 [벡터 데이터베이스](/ai-employees/knowledge-base/vector-database)를 참조하세요.
- `LLM service`에서 이미 설정된 LLM 서비스를 선택합니다. 자세한 내용은 [LLM 서비스 관리](/ai-employees/quick-start/llm-service)를 참조하세요.
- `Embedding model` 입력란에 사용할 `Embedding` 모델 이름을 입력합니다.

`Submit` 버튼을 클릭하여 벡터 스토어 정보를 저장합니다.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)