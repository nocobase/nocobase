:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

## 기본 사용법

템플릿 인쇄 플러그인은 템플릿에 동적 데이터와 논리 구조를 유연하게 삽입할 수 있는 다양한 문법을 제공합니다. 자세한 문법 설명과 사용 예시는 다음과 같습니다.

### 기본 데이터 대체

`{d.xxx}` 형식의 플레이스홀더를 사용하여 데이터를 대체합니다. 예를 들어:

- `{d.title}`: 데이터셋에서 `title` 필드를 읽어옵니다.
- `{d.date}`: 데이터셋에서 `date` 필드를 읽어옵니다.

**예시**:

템플릿 내용:
```
고객님께, 안녕하세요!

저희 제품을 구매해 주셔서 감사합니다: {d.productName}.
주문 번호: {d.orderId}
주문 날짜: {d.orderDate}

즐거운 사용 되시길 바랍니다!
```

데이터셋:
```json
{
  "productName": "스마트 워치",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

렌더링 결과:
```
고객님께, 안녕하세요!

저희 제품인 스마트 워치를 구매해 주셔서 감사합니다.
주문 번호: A123456789
주문 날짜: 2025-01-01

즐거운 사용 되시길 바랍니다!
```

### 하위 객체 접근

데이터셋에 하위 객체가 포함되어 있다면, 점(.) 표기법을 사용하여 하위 객체의 속성에 접근할 수 있습니다.

**문법**: `{d.parent.child}`

**예시**:

데이터셋:
```json
{
  "customer": {
    "name": "李雷",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

템플릿 내용:
```
고객 이름: {d.customer.name}
이메일 주소: {d.customer.contact.email}
연락처: {d.customer.contact.phone}
```

렌더링 결과:
```
고객 이름: 이레이
이메일 주소: lilei@example.com
연락처: 13800138000
```

### 배열 접근

데이터셋에 배열이 포함되어 있다면, 예약어 `i`를 사용하여 배열의 요소에 접근할 수 있습니다.

**문법**: `{d.arrayName[i].field}`

**예시**:

데이터셋:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

템플릿 내용:
```
첫 번째 직원의 성은 {d.staffs[i=0].lastname}이고, 이름은 {d.staffs[i=0].firstname}입니다.
```

렌더링 결과:
```
첫 번째 직원의 성은 Anderson이고, 이름은 James입니다.
```