:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 테이블 블록

## 소개

테이블 블록은 **NocoBase**에 내장된 핵심 데이터 블록 중 하나로, 주로 구조화된 데이터를 테이블 형식으로 표시하고 관리하는 데 사용됩니다. 유연한 설정 옵션을 제공하여, 사용자는 필요에 따라 테이블의 열, 열 너비, 정렬 규칙, 데이터 범위 등을 사용자 지정할 수 있으며, 이를 통해 특정 비즈니스 요구사항에 맞는 데이터를 표시할 수 있습니다.

#### 주요 기능:
- **유연한 열 설정**: 다양한 데이터 표시 요구사항에 맞춰 테이블의 열과 열 너비를 사용자 지정할 수 있습니다.
- **정렬 규칙**: 테이블 데이터 정렬을 지원합니다. 사용자는 다양한 필드를 기준으로 데이터를 오름차순 또는 내림차순으로 정렬할 수 있습니다.
- **데이터 범위 설정**: 데이터 범위를 설정하여 표시되는 데이터의 범위를 제어하고, 관련 없는 데이터의 간섭을 피할 수 있습니다.
- **작업 설정**: 테이블 블록에는 다양한 작업 옵션이 내장되어 있습니다. 사용자는 필터링, 새로 추가, 편집, 삭제 등의 작업을 쉽게 설정하여 데이터를 빠르게 관리할 수 있습니다.
- **빠른 편집**: 테이블 내에서 직접 데이터를 편집할 수 있어 작업 프로세스를 간소화하고 작업 효율성을 높입니다.

## 블록 설정

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### 블록 연동 규칙

연동 규칙을 통해 블록의 동작(예: 표시 여부 또는 JavaScript 실행)을 제어합니다.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

더 자세한 내용은 [연동 규칙](/interface-builder/linkage-rule)을 참조하십시오.

### 데이터 범위 설정

예시: 기본적으로 '상태'가 '결제 완료'인 주문을 필터링합니다.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

더 자세한 내용은 [데이터 범위 설정](/interface-builder/blocks/block-settings/data-scope)을 참조하십시오.

### 정렬 규칙 설정

예시: 주문 날짜를 기준으로 내림차순으로 표시합니다.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

더 자세한 내용은 [정렬 규칙 설정](/interface-builder/blocks/block-settings/sorting-rule)을 참조하십시오.

### 빠른 편집 활성화

블록 설정 및 테이블 열 설정에서 '빠른 편집 활성화'를 활성화하면 어떤 열을 빠르게 편집할 수 있는지 사용자 지정할 수 있습니다.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### 트리 테이블 활성화

데이터 테이블이 트리 형태일 때, 테이블 블록에서 '트리 테이블 활성화' 기능을 켤 수 있습니다. 이 옵션은 기본적으로 비활성화되어 있습니다. 활성화하면 블록이 데이터를 트리 구조로 표시하며, 해당 설정 옵션과 작업 기능을 지원합니다.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

![20251125210719](https://static-docs.nocobase.com/20251125210719.gif)

### 모든 행 기본 확장

트리 테이블이 활성화된 경우, 블록 로드 시 모든 하위 데이터를 기본적으로 확장하는 것을 지원합니다.

## 필드 설정

### 이 컬렉션의 필드

> **참고**: 상속된 컬렉션의 필드(즉, 부모 컬렉션 필드)는 현재 필드 목록에 자동으로 병합되어 표시됩니다.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### 관련 컬렉션의 필드

> **참고**: 관련 컬렉션의 필드를 표시하는 것을 지원합니다 (현재는 일대일 관계만 지원합니다).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### 기타 사용자 지정 열

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## 작업 설정

### 전역 작업

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [필터](/interface-builder/actions/types/filter)
- [새로 추가](/interface-builder/actions/types/add-new)
- [삭제](/interface-builder/actions/types/delete)
- [새로 고침](/interface-builder/actions/types/refresh)
- [가져오기](/interface-builder/actions/types/import)
- [내보내기](/interface-builder/actions/types/export)
- [템플릿 인쇄](/template-print/index)
- [일괄 업데이트](/interface-builder/actions/types/bulk-update)
- [첨부 파일 내보내기](/interface-builder/actions/types/export-attachments)
- [워크플로우 트리거](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI 직원](/interface-builder/actions/types/ai-employee)

### 행 작업

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [보기](/interface-builder/actions/types/view)
- [편집](/interface-builder/actions/types/edit)
- [삭제](/interface-builder/actions/types/delete)
- [팝업](/interface-builder/actions/types/pop-up)
- [링크](/interface-builder/actions/types/link)
- [기록 업데이트](/interface-builder/actions/types/update-record)
- [템플릿 인쇄](/template-print/index)
- [워크플로우 트리거](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI 직원](/interface-builder/actions/types/ai-employee)