:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 상세 정보 블록

## 소개

상세 정보 블록은 각 데이터 레코드의 필드 값을 표시하는 데 사용됩니다. 유연한 필드 레이아웃을 지원하며, 다양한 데이터 작업 기능이 내장되어 있어 사용자가 정보를 편리하게 확인하고 관리할 수 있습니다.

## 블록 설정

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### 블록 연동 규칙

연동 규칙을 통해 블록 동작(예: 표시 여부 또는 JavaScript 실행)을 제어합니다.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
더 자세한 내용은 [연동 규칙](/interface-builder/linkage-rule)을 참고하세요.

### 데이터 범위 설정

예시: 결제 완료된 주문만 표시합니다.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

더 자세한 내용은 [데이터 범위 설정](/interface-builder/blocks/block-settings/data-scope)을 참고하세요.

### 필드 연동 규칙

상세 정보 블록의 연동 규칙은 필드의 표시/숨김을 동적으로 설정하는 것을 지원합니다.

예시: 주문 상태가 '취소'일 때 금액을 표시하지 않습니다.

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

더 자세한 내용은 [연동 규칙](/interface-builder/linkage-rule)을 참고하세요.

## 필드 구성

### 현재 컬렉션 필드

> **참고**: 상속된 컬렉션의 필드(즉, 부모 컬렉션 필드)는 현재 필드 목록에 자동으로 병합되어 표시됩니다.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### 관계 컬렉션 필드

> **참고**: 관계 컬렉션 필드를 표시하는 것을 지원합니다(현재는 일대일 관계만 지원합니다).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### 기타 필드
- JS 필드
- JS 아이템
- 구분선
- 마크다운

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **팁**: JavaScript를 작성하여 사용자 지정 표시 내용을 구현할 수 있으며, 이를 통해 더 복잡한 정보를 표시할 수 있습니다.  
> 예를 들어, 다양한 데이터 유형, 조건 또는 로직에 따라 다른 표시 효과를 렌더링할 수 있습니다.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## 액션 구성

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [편집](/interface-builder/actions/types/edit)
- [삭제](/interface-builder/actions/types/delete)
- [링크](/interface-builder/actions/types/link)
- [팝업](/interface-builder/actions/types/pop-up)
- [레코드 업데이트](/interface-builder/actions/types/update-record)
- [워크플로우 트리거](/interface-builder/actions/types/trigger-workflow)
- [JS 액션](/interface-builder/actions/types/js-action)
- [AI 직원](/interface-builder/actions/types/ai-employee)