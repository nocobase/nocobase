:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 폼 블록

## 소개

폼 블록은 데이터를 입력하고 편집하는 인터페이스를 구축하는 데 중요한 블록입니다. 높은 사용자 정의 기능을 제공하며, 데이터 모델을 기반으로 필요한 필드를 해당 컴포넌트를 사용하여 표시합니다. 연동 규칙과 같은 이벤트 흐름을 통해 폼 블록은 필드를 동적으로 표시할 수 있습니다. 또한, 워크플로우와 결합하여 자동화된 프로세스 트리거 및 데이터 처리를 구현하고, 업무 효율성을 더욱 높이거나 로직을 구성할 수 있습니다.

## 폼 블록 추가

- **폼 편집**: 기존 데이터를 수정하는 데 사용합니다.
- **폼 추가**: 새로운 데이터 항목을 생성하는 데 사용합니다.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## 블록 설정

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### 블록 연동 규칙

연동 규칙을 통해 블록 동작(예: 표시 여부 또는 JavaScript 실행)을 제어합니다.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

더 자세한 내용은 [블록 연동 규칙](/interface-builder/blocks/block-settings/block-linkage-rule)을 참조하십시오.

### 필드 연동 규칙

연동 규칙을 통해 폼 필드 동작을 제어합니다.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

더 자세한 내용은 [필드 연동 규칙](/interface-builder/blocks/block-settings/field-linkage-rule)을 참조하십시오.

### 레이아웃

폼 블록은 두 가지 레이아웃 방식을 지원하며, `layout` 속성을 통해 설정할 수 있습니다.

- **horizontal** (수평 레이아웃): 이 레이아웃은 레이블과 내용을 한 줄에 표시하여 수직 공간을 절약합니다. 간단한 폼이나 정보가 적은 경우에 적합합니다.
- **vertical** (수직 레이아웃) (기본값): 레이블이 필드 위에 배치됩니다. 이 레이아웃은 폼을 더 읽기 쉽고 작성하기 쉽게 만들며, 특히 여러 필드나 복잡한 입력 항목이 포함된 폼에 적합합니다.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## 필드 구성

### 현재 컬렉션 필드

> **참고**: 상속된 컬렉션의 필드(즉, 부모 컬렉션 필드)는 현재 필드 목록에 자동으로 병합되어 표시됩니다.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### 기타 필드

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- JavaScript를 작성하여 사용자 정의 표시 내용을 구현하고 복잡한 정보를 표시할 수 있습니다.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## 액션 구성

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [제출](/interface-builder/actions/types/submit)
- [워크플로우 트리거](/interface-builder/actions/types/trigger-workflow)
- [JS 액션](/interface-builder/actions/types/js-action)
- [AI 직원](/interface-builder/actions/types/ai-employee)