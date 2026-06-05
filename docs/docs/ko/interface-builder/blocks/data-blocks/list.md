---
pkg: "@nocobase/plugin-block-list"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 목록 블록

## 소개

목록 블록은 데이터를 목록 형태로 표시하며, 할 일 목록, 뉴스 정보, 제품 정보 등 다양한 데이터 표시 시나리오에 활용할 수 있습니다.

## 블록 설정

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### 데이터 범위 설정

그림과 같이, 주문 상태가 '취소'인 문서를 필터링하여 확인합니다.

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

자세한 내용은 [데이터 범위 설정](/interface-builder/blocks/block-settings/data-scope)을 참고하세요.

### 정렬 규칙 설정

그림과 같이, 주문 금액을 기준으로 내림차순으로 정렬합니다.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

자세한 내용은 [정렬 규칙 설정](/interface-builder/blocks/block-settings/sorting-rule)을 참고하세요.

## 필드 설정

### 현재 컬렉션 필드

> **참고**: 상속된 컬렉션의 필드(즉, 부모 컬렉션 필드)는 현재 필드 목록에 자동으로 병합되어 표시됩니다.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### 관계 컬렉션 필드

> **참고**: 관계 컬렉션 필드를 표시할 수 있습니다(현재는 일대일 관계만 지원합니다).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

목록 필드 설정 항목은 [상세 필드](/interface-builder/fields/generic/detail-form-item)를 참고하세요.

## 작업 설정

### 전역 작업

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [필터](/interface-builder/actions/types/filter)
- [추가](/interface-builder/actions/types/add-new)
- [삭제](/interface-builder/actions/types/delete)
- [새로고침](/interface-builder/actions/types/refresh)
- [가져오기](/interface-builder/actions/types/import)
- [내보내기](/interface-builder/actions/types/export)
- [템플릿 인쇄](/template-print/index)
- [일괄 업데이트](/interface-builder/actions/types/bulk-update)
- [첨부 파일 내보내기](/interface-builder/actions/types/export-attachments)
- [워크플로우 트리거](/interface-builder/actions/types/trigger-workflow)
- [JS 액션](/interface-builder/actions/types/js-action)
- [AI 직원](/interface-builder/actions/types/ai-employee)

### 행 작업

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [편집](/interface-builder/actions/types/edit)
- [삭제](/interface-builder/actions/types/delete)
- [링크](/interface-builder/actions/types/link)
- [팝업](/interface-builder/actions/types/pop-up)
- [기록 업데이트](/interface-builder/actions/types/update-record)
- [템플릿 인쇄](/template-print/index)
- [워크플로우 트리거](/interface-builder/actions/types/trigger-workflow)
- [JS 액션](/interface-builder/actions/types/js-action)
- [AI 직원](/interface-builder/actions/types/ai-employee)