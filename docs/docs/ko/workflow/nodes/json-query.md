---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# JSON 계산

## 소개

다양한 JSON 계산 엔진을 기반으로, 상위 노드에서 생성된 복잡한 JSON 데이터를 계산하거나 구조를 변환하여 후속 노드에서 사용할 수 있도록 합니다. 예를 들어, SQL 작업 및 HTTP 요청 노드의 결과를 이 노드를 통해 필요한 값과 변수 형식으로 변환하여 후속 노드에서 활용할 수 있습니다.

## 노드 생성

워크플로우 설정 화면에서 프로세스 내의 더하기("+"") 버튼을 클릭하여 "JSON 계산" 노드를 추가합니다.

![노드 생성](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=팁}
일반적으로 JSON 계산 노드는 다른 데이터 노드 아래에 생성하여 해당 데이터를 파싱하는 데 사용됩니다.
:::

## 노드 설정

### 파싱 엔진

JSON 계산 노드는 다양한 파싱 엔진을 통해 여러 구문을 지원합니다. 사용자의 선호도와 각 엔진의 특징에 따라 선택할 수 있습니다. 현재 세 가지 파싱 엔진을 지원합니다.

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![엔진 선택](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### 데이터 소스

데이터 소스는 상위 노드의 결과이거나 워크플로우 컨텍스트 내의 데이터 객체일 수 있습니다. 일반적으로 SQL 노드 또는 HTTP 요청 노드의 결과와 같이 내장된 구조가 없는 데이터 객체입니다.

![데이터 소스](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=팁}
일반적으로 컬렉션 관련 노드의 데이터 객체는 컬렉션 설정 정보를 통해 구조화되어 있으므로, JSON 계산 노드를 통해 파싱할 필요가 없습니다.
:::

### 파싱 표현식

파싱 요구사항과 선택한 파싱 엔진에 따라 사용자 정의 파싱 표현식을 작성합니다.

![파싱 표현식](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=팁}
각 엔진은 서로 다른 파싱 구문을 제공합니다. 자세한 내용은 링크된 문서를 참조해 주세요.
:::

`v1.0.0-alpha.15` 버전부터 표현식에서 변수 사용을 지원합니다. 변수는 특정 엔진이 실행되기 전에 미리 파싱되어, 문자열 템플릿 규칙에 따라 변수가 특정 문자열 값으로 대체되고 표현식의 다른 정적 문자열과 결합하여 최종 표현식을 구성합니다. 이 기능은 동적으로 표현식을 구성해야 할 때, 예를 들어 일부 JSON 콘텐츠에 동적 키를 사용하여 파싱해야 할 때 매우 유용합니다.

### 속성 매핑

계산 결과가 객체(또는 객체 배열)인 경우, 속성 매핑을 통해 필요한 속성을 하위 변수로 추가 매핑하여 후속 노드에서 사용할 수 있습니다.

![속성 매핑](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=팁}
객체(또는 객체 배열) 결과의 경우, 속성 매핑을 수행하지 않으면 전체 객체(또는 객체 배열)가 노드 결과에 단일 변수로 저장되며, 객체의 속성 값을 변수 형태로 직접 사용할 수 없습니다.
:::

## 예시

파싱할 데이터가 이전 SQL 노드에서 데이터를 조회한 결과이며, 그 결과가 다음과 같은 주문 데이터 집합이라고 가정해 봅시다.

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

데이터 내 두 주문의 총 가격을 파싱하고 계산하여 해당 주문 ID와 함께 객체로 구성한 다음, 주문의 총 가격을 업데이트해야 한다면 다음과 같이 설정할 수 있습니다.

![예시 - SQL 설정 파싱](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1.  JSONata 파싱 엔진을 선택합니다.
2.  SQL 노드의 결과를 데이터 소스로 선택합니다.
3.  JSONata 표현식 `$[0].{"id": id, "total": products.(price * quantity)}`를 사용하여 파싱합니다.
4.  속성 매핑을 선택하여 `id`와 `total`을 하위 변수로 매핑합니다.

최종 파싱 결과는 다음과 같습니다.

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

그 다음, 결과로 나온 주문 배열을 반복하여 각 주문의 총 가격을 업데이트하면 됩니다.

![해당 주문의 총 가격 업데이트](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)