:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/interface-builder/blocks/data-blocks/form)을 참조하세요.
:::

# 폼 블록

## 소개

폼 블록은 데이터 입력 및 편집 인터페이스를 구축하는 데 중요한 블록입니다. 높은 사용자 정의성을 갖추고 있으며, 데이터 모델을 기반으로 해당 컴포넌트를 사용하여 필요한 필드를 표시합니다. 연동 규칙 등의 이벤트 흐름을 통해 폼 블록은 필드를 동적으로 표시할 수 있습니다. 또한 워크플로우와 결합하여 자동화된 프로세스 트리거 및 데이터 처리를 구현함으로써 작업 효율성을 높이거나 로직을 편성할 수 있습니다.

## 폼 블록 추가

- **폼 편집**: 기존 데이터를 수정하는 데 사용합니다.
- **폼 추가**: 새로운 데이터 항목을 생성하는 데 사용합니다.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## 블록 설정 항목

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### 블록 연동 규칙

연동 규칙을 통해 블록 동작(표시 여부 또는 JavaScript 실행 등)을 제어합니다.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

자세한 내용은 [블록 연동 규칙](/interface-builder/blocks/block-settings/block-linkage-rule)을 참조하십시오.

### 필드 연동 규칙

연동 규칙을 통해 폼 필드 동작을 제어합니다.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

자세한 내용은 [필드 연동 규칙](/interface-builder/blocks/block-settings/field-linkage-rule)을 참조하십시오.

### 레이아웃

폼 블록은 두 가지 레이아웃 방식을 지원하며, `layout` 속성을 통해 설정할 수 있습니다.

- **horizontal** (수평 레이아웃): 레이블과 내용을 한 줄에 표시하여 수직 공간을 절약하며, 간단한 폼이나 정보가 적은 경우에 적합합니다.
- **vertical** (수직 레이아웃) (기본값): 레이블이 필드 위에 위치하며, 폼을 더 읽기 쉽고 작성하기 쉽게 만듭니다. 특히 여러 필드나 복잡한 입력 항목이 포함된 폼에 적합합니다.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## 필드 설정

### 본 컬렉션 필드

> **참고**: 상속된 컬렉션의 필드(즉, 부모 컬렉션 필드)는 현재 필드 목록에 자동으로 병합되어 표시됩니다.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### 관계 컬렉션 필드

> 관계 컬렉션 필드는 폼에서 읽기 전용이며, 일반적으로 관계 필드와 함께 사용되어 관계 데이터의 여러 필드 값을 표시할 수 있습니다.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- 현재는 일대일 관계(belongsTo / hasOne 등)만 지원합니다.
- 일반적으로 관계 필드(관련 레코드 선택용)와 함께 사용됩니다. 관계 필드 컴포넌트는 관련 레코드의 선택/변경을 담당하고, 관계 컬렉션 필드는 해당 레코드의 상세 정보(읽기 전용)를 표시하는 역할을 합니다.

**예시**: 「책임자」를 선택한 후, 폼 내에 해당 책임자의 휴대폰 번호, 이메일 주소 등의 정보를 표시합니다.

> 편집 폼에서 관계 필드 「책임자」를 설정하지 않아도 관련 정보를 표시할 수 있습니다. 관계 필드 「책임자」를 설정한 경우, 책임자를 변경하면 관련 정보가 해당 레코드에 맞게 업데이트됩니다.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### 기타 필드

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- JavaScript를 작성하여 사용자 정의 표시 내용을 구현하고 복잡한 내용을 전시할 수 있습니다.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### 필드 템플릿

필드 템플릿은 폼 블록에서 필드 영역의 설정을 재사용하는 데 사용됩니다. 자세한 내용은 [필드 템플릿](/interface-builder/fields/field-template)을 참조하십시오.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## 작업 설정

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [제출](/interface-builder/actions/types/submit)
- [워크플로우 트리거](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI 직원](/interface-builder/actions/types/ai-employee)