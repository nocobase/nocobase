:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 컬렉션 필드

## 필드의 Interface 타입

NocoBase는 Interface 관점에서 필드를 다음과 같이 분류합니다.

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## 필드 데이터 타입

각 Field Interface에는 기본 데이터 타입이 있습니다. 예를 들어, Interface가 숫자(Number)인 필드의 경우, 기본 데이터 타입은 double이지만 float, decimal 등으로 변경할 수도 있습니다. 현재 지원되는 데이터 타입은 다음과 같습니다:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## 필드 타입 매핑

주 데이터베이스에 새 필드를 추가하는 과정은 다음과 같습니다:

1. Interface 타입을 선택합니다.
2. 현재 Interface에서 선택할 수 있는 데이터 타입을 설정합니다.

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

외부 데이터 소스의 필드 매핑 과정은 다음과 같습니다:

1. 외부 데이터베이스의 필드 타입에 따라 해당 데이터 타입(Field type)과 UI 타입(Field Interface)을 자동으로 매핑합니다.
2. 필요에 따라 더 적합한 데이터 타입과 Interface 타입으로 수정합니다.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)