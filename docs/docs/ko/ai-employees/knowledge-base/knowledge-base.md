:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 지식 베이스

## 소개

지식 베이스는 RAG 검색의 기반입니다. 문서를 분류하여 정리하고 인덱스를 구축합니다. AI 직원이 질문에 답변할 때, 지식 베이스에서 우선적으로 답변을 검색합니다.

## 지식 베이스 관리

AI 직원 플러그인 설정 페이지로 이동하여 `Knowledge base` 탭을 클릭하면 지식 베이스 관리 페이지로 이동합니다.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

오른쪽 상단의 `Add new` 버튼을 클릭하여 `Local` 지식 베이스를 새로 추가합니다.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

새 지식 베이스에 필요한 정보를 입력합니다:

- `Name` 입력란에 지식 베이스 이름을 입력합니다.
- `File storage`에서 파일 저장 위치를 선택합니다.
- `Vector store`에서 벡터 저장소를 선택합니다. [벡터 저장소](/ai-employees/knowledge-base/vector-store)를 참고하세요.
- `Description` 입력란에 지식 베이스 설명을 입력합니다.

`Submit` 버튼을 클릭하여 지식 베이스를 생성합니다.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## 지식 베이스 문서 관리

지식 베이스를 생성한 후, 지식 베이스 목록 페이지에서 방금 생성한 지식 베이스를 클릭하면 지식 베이스 문서 관리 페이지로 이동합니다.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

`Upload` 버튼을 클릭하여 문서를 업로드합니다. 문서 업로드 후, 자동으로 벡터화가 시작됩니다. `Status`가 `Pending` 상태에서 `Success` 상태로 변경될 때까지 기다려 주세요.

현재 지식 베이스에서 지원하는 문서 유형은 txt, pdf, doc, docx, ppt, pptx입니다. PDF는 일반 텍스트만 지원합니다.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## 지식 베이스 유형

### Local 지식 베이스

Local 지식 베이스는 NocoBase에 로컬로 저장되는 지식 베이스입니다. 문서와 문서의 벡터 데이터 모두 NocoBase에 로컬로 저장됩니다.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Readonly 지식 베이스

Readonly 지식 베이스는 읽기 전용 지식 베이스입니다. 문서와 벡터 데이터는 외부에서 관리되며, NocoBase에서는 벡터 데이터베이스 연결만 생성합니다 (현재 PGVector만 지원합니다).

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### External 지식 베이스

External 지식 베이스는 외부 지식 베이스입니다. 문서와 벡터 데이터는 외부에서 관리됩니다. 벡터 데이터베이스 검색은 개발자의 확장이 필요하며, 이를 통해 현재 NocoBase에서 지원하지 않는 벡터 데이터베이스도 사용할 수 있습니다.

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)