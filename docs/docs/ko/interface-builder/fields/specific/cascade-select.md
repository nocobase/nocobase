:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 계단식 선택

## 소개

계단식 선택기는 대상 컬렉션이 트리 테이블인 관계 필드에 사용됩니다. 사용자는 트리 컬렉션의 계층 구조에 따라 데이터를 선택할 수 있으며, 빠른 필터링을 위한 퍼지 검색을 지원합니다.

## 사용 방법

- **일대일** 관계의 경우, 계단식 선택기는 **단일 선택**입니다.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- **일대다** 관계의 경우, 계단식 선택기는 **다중 선택**입니다.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## 필드 구성 옵션

### 제목 필드

제목 필드는 각 옵션에 표시되는 레이블을 결정합니다.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> 제목 필드를 기반으로 빠른 검색을 지원합니다.

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

더 자세한 내용은 다음을 참조하세요:
[제목 필드](/interface-builder/fields/field-settings/title-field)

### 데이터 범위 설정

트리 목록의 데이터 범위를 제어합니다 (자식 레코드가 조건과 일치하면 해당 부모 레코드도 포함됩니다).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

더 자세한 내용은 다음을 참조하세요:
[데이터 범위](/interface-builder/fields/field-settings/data-scope)

[필드 컴포넌트](/interface-builder/fields/association-field)