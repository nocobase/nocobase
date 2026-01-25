:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

### 통화 형식 지정

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### 구문 설명
통화 숫자의 형식을 지정하며, 소수점 자릿수 또는 특정 출력 형식을 지정할 수 있습니다.
매개변수:
- precisionOrFormat: 선택 사항입니다. 숫자로 소수점 자릿수를 지정하거나 특정 형식 식별자를 사용할 수 있습니다.
  - 정수: 기본 소수점 정밀도를 변경합니다.
  - `'M'`: 주요 통화 이름만 출력합니다.
  - `'L'`: 숫자와 함께 통화 기호를 출력합니다 (기본값).
  - `'LL'`: 숫자와 함께 주요 통화 이름을 출력합니다.
- targetCurrency: 선택 사항입니다. 대상 통화 코드(대문자, 예: USD, EUR)이며, 전역 설정을 재정의합니다.

##### 예시
```
// 예시 환경: API 옵션 { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // 출력 "$2,000.91"
'1000.456':formatC('M')    // 출력 "dollars"
'1':formatC('M')           // 출력 "dollar"
'1000':formatC('L')        // 출력 "$2,000.00"
'1000':formatC('LL')       // 출력 "2,000.00 dollars"

// 프랑스어 예시 (환경 설정이 다를 경우):
'1000.456':formatC()      // 출력 "2 000,91 ..."  
'1000.456':formatC()      // 원본 통화와 대상 통화가 같을 때 "1 000,46 €" 출력
```

##### 결과
출력 결과는 API 옵션 및 환율 설정에 따라 달라집니다.

#### 2. :convCurr(target, source)

##### 구문 설명
숫자를 한 통화에서 다른 통화로 변환합니다. 환율은 API 옵션을 통해 전달하거나 전역으로 설정할 수 있습니다.
매개변수를 지정하지 않으면 `options.currencySource`에서 `options.currencyTarget`으로 자동 변환됩니다.
매개변수:
- target: 선택 사항입니다. 대상 통화 코드(`options.currencyTarget`가 기본값입니다).
- source: 선택 사항입니다. 원본 통화 코드(`options.currencySource`가 기본값입니다).

##### 예시
```
// 예시 환경: API 옵션 { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // 출력 20
1000:convCurr()            // 출력 2000
1000:convCurr('EUR')        // 출력 1000
1000:convCurr('USD')        // 출력 2000
1000:convCurr('USD', 'USD') // 출력 1000
```

##### 결과
출력은 변환된 통화 값입니다.