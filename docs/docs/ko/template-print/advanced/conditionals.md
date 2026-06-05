:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

## 조건문

조건문은 데이터 값에 따라 문서 콘텐츠의 표시 여부를 동적으로 제어할 수 있도록 합니다. 주요 조건 작성 방법은 세 가지입니다.

- **인라인 조건**: 텍스트를 직접 출력하거나 다른 텍스트로 대체합니다.
- **조건 블록**: 문서의 특정 영역을 표시하거나 숨기는 데 사용되며, 여러 태그, 단락, 표 등에 적용할 수 있습니다.
- **스마트 조건**: 단일 태그를 사용하여 대상 요소(행, 단락, 이미지 등)를 직접 제거하거나 유지하며, 더 간결한 문법을 제공합니다.

모든 조건은 논리 판단 포맷터(예: ifEQ, ifGT 등)로 시작하며, 그 뒤에 실행 동작 포맷터(예: show, elseShow, drop, keep 등)가 따라옵니다.


### 개요

조건문에서 지원하는 논리 연산자와 동작 포맷터는 다음과 같습니다.

- **논리 연산자**
  - **ifEQ(value)**: 데이터가 지정된 값과 같은지 확인합니다.
  - **ifNE(value)**: 데이터가 지정된 값과 다른지 확인합니다.
  - **ifGT(value)**: 데이터가 지정된 값보다 큰지 확인합니다.
  - **ifGTE(value)**: 데이터가 지정된 값보다 크거나 같은지 확인합니다.
  - **ifLT(value)**: 데이터가 지정된 값보다 작은지 확인합니다.
  - **ifLTE(value)**: 데이터가 지정된 값보다 작거나 같은지 확인합니다.
  - **ifIN(value)**: 데이터가 배열 또는 문자열에 포함되어 있는지 확인합니다.
  - **ifNIN(value)**: 데이터가 배열 또는 문자열에 포함되어 있지 않은지 확인합니다.
  - **ifEM()**: 데이터가 비어 있는지 확인합니다(예: null, undefined, 빈 문자열, 빈 배열 또는 빈 객체).
  - **ifNEM()**: 데이터가 비어 있지 않은지 확인합니다.
  - **ifTE(type)**: 데이터 유형이 지정된 유형(예: "string", "number", "boolean" 등)과 같은지 확인합니다.
  - **and(value)**: 논리 'AND' 연산자로, 여러 조건을 연결하는 데 사용됩니다.
  - **or(value)**: 논리 'OR' 연산자로, 여러 조건을 연결하는 데 사용됩니다.

- **동작 포맷터**
  - **:show(text) / :elseShow(text)**: 인라인 조건에 사용되며, 지정된 텍스트를 직접 출력합니다.
  - **:hideBegin / :hideEnd** 및 **:showBegin / :showEnd**: 조건 블록에 사용되며, 문서 블록을 숨기거나 표시합니다.
  - **:drop(element) / :keep(element)**: 스마트 조건에 사용되며, 지정된 문서 요소를 제거하거나 유지합니다.

다음 섹션에서는 각 사용법에 대한 자세한 문법, 예시 및 결과를 설명합니다.


### 인라인 조건

#### 1. :show(text) / :elseShow(text)

##### 문법
```
{데이터:조건:show(텍스트)}
{데이터:조건:show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
데이터는 다음과 같다고 가정합니다.
```json
{
  "val2": 2,
  "val5": 5
}
```
템플릿은 다음과 같습니다.
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### 결과
```
val2 = 2
val2 = low
val5 = high
```


#### 2. Switch Case (다중 조건 판단)

##### 문법
연속적인 조건 포맷터를 사용하여 switch-case와 유사한 구조를 만듭니다.
```
{데이터:ifEQ(값1):show(결과1):ifEQ(값2):show(결과2):elseShow(기본 결과)}
```
또는 `or` 연산자를 사용하여 구현할 수 있습니다.
```
{데이터:ifEQ(값1):show(결과1):or(데이터):ifEQ(값2):show(결과2):elseShow(기본 결과)}
```

##### 예시
데이터:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
템플릿:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### 결과
```
val1 = A
val2 = B
val3 = C
```


#### 3. 다중 변수 조건 판단

##### 문법
논리 연산자 `and`/`or`를 사용하여 여러 변수를 테스트할 수 있습니다.
```
{데이터1:ifEQ(조건1):and(.데이터2):ifEQ(조건2):show(결과):elseShow(대체 결과)}
{데이터1:ifEQ(조건1):or(.데이터2):ifEQ(조건2):show(결과):elseShow(대체 결과)}
```

##### 예시
데이터:
```json
{
  "val2": 2,
  "val5": 5
}
```
템플릿:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### 결과
```
and = KO
or = OK
```


### 논리 연산자 및 포맷터

다음 섹션에서 설명하는 포맷터는 모두 인라인 조건 형식을 사용하며, 문법은 다음과 같습니다.
```
{데이터:포맷터(매개변수):show(텍스트):elseShow(대체 텍스트)}
```

#### 1. :and(value)

##### 문법
```
{데이터:ifEQ(값):and(새로운 데이터 또는 조건):ifGT(다른 값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### 결과
`d.car`가 `'delorean'`과 같고 `d.speed`가 80보다 크면 `TravelInTime`을 출력하고, 그렇지 않으면 `StayHere`를 출력합니다.


#### 2. :or(value)

##### 문법
```
{데이터:ifEQ(값):or(새로운 데이터 또는 조건):ifGT(다른 값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### 결과
`d.car`가 `'delorean'`과 같거나 `d.speed`가 80보다 크면 `TravelInTime`을 출력하고, 그렇지 않으면 `StayHere`를 출력합니다.


#### 3. :ifEM()

##### 문법
```
{데이터:ifEM():show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### 결과
`null` 또는 빈 배열의 경우 `Result true`를 출력하고, 그렇지 않으면 `Result false`를 출력합니다.


#### 4. :ifNEM()

##### 문법
```
{데이터:ifNEM():show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### 결과
비어 있지 않은 데이터(예: 숫자 0 또는 문자열 'homer')의 경우 `Result true`를 출력하고, 비어 있는 데이터의 경우 `Result false`를 출력합니다.


#### 5. :ifEQ(value)

##### 문법
```
{데이터:ifEQ(값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### 결과
데이터가 지정된 값과 같으면 `Result true`를 출력하고, 그렇지 않으면 `Result false`를 출력합니다.


#### 6. :ifNE(value)

##### 문법
```
{데이터:ifNE(값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### 결과
첫 번째 예시는 `Result false`를 출력하고, 두 번째 예시는 `Result true`를 출력합니다.


#### 7. :ifGT(value)

##### 문법
```
{데이터:ifGT(값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### 결과
첫 번째 예시는 `Result true`를 출력하고, 두 번째 예시는 `Result false`를 출력합니다.


#### 8. :ifGTE(value)

##### 문법
```
{데이터:ifGTE(값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### 결과
첫 번째 예시는 `Result true`를 출력하고, 두 번째 예시는 `Result false`를 출력합니다.


#### 9. :ifLT(value)

##### 문법
```
{데이터:ifLT(값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### 결과
첫 번째 예시는 `Result true`를 출력하고, 두 번째 예시는 `Result false`를 출력합니다.


#### 10. :ifLTE(value)

##### 문법
```
{데이터:ifLTE(값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### 결과
첫 번째 예시는 `Result true`를 출력하고, 두 번째 예시는 `Result false`를 출력합니다.


#### 11. :ifIN(value)

##### 문법
```
{데이터:ifIN(값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### 결과
두 예시 모두 `Result true`를 출력합니다('is'가 문자열에 포함되어 있고, 2가 배열에 포함되어 있기 때문입니다).


#### 12. :ifNIN(value)

##### 문법
```
{데이터:ifNIN(값):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### 결과
첫 번째 예시는 `Result false`를 출력하고('is'가 문자열에 포함되어 있기 때문), 두 번째 예시는 `Result false`를 출력합니다(2가 배열에 포함되어 있기 때문).


#### 13. :ifTE(type)

##### 문법
```
{데이터:ifTE('유형'):show(텍스트):elseShow(대체 텍스트)}
```

##### 예시
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### 결과
첫 번째 예시는 `Result true`를 출력하고('homer'는 문자열), 두 번째 예시는 `Result true`를 출력합니다(10.5는 숫자).


### 조건 블록

조건 블록은 문서의 특정 영역을 표시하거나 숨기는 데 사용되며, 일반적으로 여러 태그 또는 전체 텍스트 블록을 감싸는 데 활용됩니다.

#### 1. :showBegin / :showEnd

##### 문법
```
{데이터:ifEQ(조건):showBegin}
문서 블록 내용
{데이터:showEnd}
```

##### 예시
데이터:
```json
{
  "toBuy": true
}
```
템플릿:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### 결과
조건이 충족되면 중간의 내용이 표시됩니다.
```
Banana
Apple
Pineapple
Grapes
```


#### 2. :hideBegin / :hideEnd

##### 문법
```
{데이터:ifEQ(조건):hideBegin}
문서 블록 내용
{데이터:hideEnd}
```

##### 예시
데이터:
```json
{
  "toBuy": true
}
```
템플릿:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### 결과
조건이 충족되면 중간의 내용이 숨겨지며, 결과는 다음과 같습니다.
```
Banana
Grapes
```