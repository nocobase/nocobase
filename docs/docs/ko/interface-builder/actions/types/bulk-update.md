---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 일괄 업데이트

## 소개

일괄 업데이트 액션은 여러 레코드에 동일한 업데이트를 적용해야 할 때 사용됩니다. 일괄 업데이트를 수행하기 전에 사용자는 업데이트할 필드 할당 로직을 미리 정의해야 합니다. 이 로직은 사용자가 업데이트 버튼을 클릭할 때 선택된 모든 레코드에 적용됩니다.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## 액션 설정

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### 업데이트할 데이터

선택됨/모두, 기본값은 '선택됨'입니다.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### 필드 할당

일괄 업데이트할 필드를 설정합니다. 설정된 필드만 업데이트됩니다.

그림과 같이 주문 테이블에서 일괄 업데이트 액션을 설정하여 선택된 데이터를 '승인 대기'로 일괄 업데이트합니다.

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [버튼 편집](/interface-builder/actions/action-settings/edit-button): 버튼의 제목, 유형, 아이콘을 편집합니다.
- [연동 규칙](/interface-builder/actions/action-settings/linkage-rule): 버튼을 동적으로 표시/숨깁니다.
- [재확인](/interface-builder/actions/action-settings/double-check)