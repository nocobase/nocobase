---
pkg: "@nocobase/plugin-action-import"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 임포트

## 소개

Excel 템플릿을 사용하여 데이터를 임포트할 수 있습니다. 어떤 필드를 임포트할지 설정할 수 있으며, 템플릿은 자동으로 생성됩니다.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## 임포트 안내

### 숫자 타입 필드

숫자와 백분율을 지원하며, `N/A` 또는 `-`와 같은 텍스트는 필터링됩니다.

| 숫자1 | 백분율 | 숫자2 | 숫자3 |
| ----- | ------ | ----- | ----- |
| 123   | 25%    | N/A   | -     |

JSON으로 변환 후:

```ts
{
  "숫자1": 123,
  "백분율": 0.25,
  "숫자2": null,
  "숫자3": null,
}
```

### 불리언 타입 필드

지원되는 입력 텍스트 (영어는 대소문자를 구분하지 않습니다):

- `Yes`, `Y`, `True`, `1`, `是`
- `No`, `N`, `False`, `0`, `否`

| 필드1 | 필드2 | 필드3 | 필드4 | 필드5 |
| ----- | ----- | ----- | ----- | ----- |
| 否    | 是    | Y     | true  | 0     |

JSON으로 변환 후:

```ts
{
  "필드1": false,
  "필드2": true,
  "필드3": true,
  "필드4": true,
  "필드5": false,
}
```

### 날짜 타입 필드

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

JSON으로 변환 후:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### 선택 타입 필드

옵션 값과 옵션 레이블 모두 임포트 텍스트로 사용할 수 있습니다. 여러 옵션은 쉼표(`,` `，`) 또는 열거형 쉼표(`、`)로 구분됩니다.

예를 들어, `우선순위` 필드의 옵션은 다음과 같습니다:

| 옵션 값 | 옵션 레이블 |
| ------ | -------- |
| low    | 낮음       |
| medium | 중간       |
| high   | 높음       |

옵션 값과 옵션 레이블 모두 임포트 텍스트로 사용할 수 있습니다.

| 우선순위 |
| ------ |
| 높음     |
| low    |

JSON으로 변환 후:

```ts
[{ 우선순위: 'high' }, { 우선순위: 'low' }];
```

### 중국 행정 구역 필드

| 지역1         | 지역2         |
| ------------- | ------------- |
| 北京市/市辖区 | 天津市/市辖区 |

JSON으로 변환 후:

```ts
{
  "지역1": ["11","1101"],
  "지역2": ["12","1201"]
}
```

### 첨부 파일 필드

| 첨부 파일                                |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

JSON으로 변환 후:

```ts
{
  "첨부 파일": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### 관계 타입 필드

여러 데이터 항목은 쉼표(`,` `，`) 또는 열거형 쉼표(`、`)로 구분됩니다.

| 부서/이름 | 카테고리/제목    |
| --------- | ------------ |
| 개발팀    | 카테고리1、카테고리2 |

JSON으로 변환 후:

```ts
{
  "부서": [1], // 1은 "개발팀"이라는 부서 이름의 레코드 ID입니다.
  "카테고리": [1,2], // 1,2는 "카테고리1"과 "카테고리2"라는 카테고리 제목의 레코드 ID입니다.
}
```

### JSON 타입 필드

| JSON1           |
| --------------- |
| {"key":"value"} |

JSON으로 변환 후:

```ts
{
  "JSON": {"key":"value"}
}
```

### 지도 지오메트리 타입

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

JSON으로 변환 후:

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## 사용자 정의 임포트 형식

`db.registerFieldValueParsers()` 메서드를 통해 사용자 정의 `ValueParser`를 등록할 수 있습니다. 예를 들어:

```ts
import { BaseValueParser } from '@nocobase/database';

class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

const db = new Database();

// type=point인 필드를 임포트할 때, 데이터는 PointValueParser를 통해 파싱됩니다.
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

임포트 예시

| Point |
| ----- |
| 1,2   |

JSON으로 변환 후:

```ts
{
  "Point": [1,2]
}
```

## 액션 설정

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- 임포트 가능한 필드 설정

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [연동 규칙](/interface-builder/actions/action-settings/linkage-rule): 버튼을 동적으로 표시/숨김;
- [버튼 편집](/interface-builder/actions/action-settings/edit-button): 버튼의 제목, 타입, 아이콘을 편집합니다.