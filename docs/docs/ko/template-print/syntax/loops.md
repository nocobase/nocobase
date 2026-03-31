:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

## 반복 처리

반복 처리는 배열이나 객체 내의 데이터를 반복적으로 렌더링하는 데 사용됩니다. 반복 시작과 끝을 나타내는 마커를 정의하여 반복할 내용을 식별합니다. 아래에서는 몇 가지 일반적인 경우를 설명합니다.

### 배열 반복하기

#### 1. 구문 설명

- `{d.array[i].property}` 태그를 사용하여 현재 반복 항목을 정의하고, `{d.array[i+1].property}`를 사용하여 다음 항목을 지정함으로써 반복 영역을 표시합니다.
- 반복 시 첫 번째 줄(`[i]` 부분)이 자동으로 템플릿으로 사용되어 반복됩니다. 템플릿에는 반복 예시를 한 번만 작성하면 됩니다.

예시 구문 형식:
```
{d.arrayName[i].property}
{d.arrayName[i+1].property}
```

#### 2. 예시: 간단한 배열 반복

##### 데이터
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### 템플릿
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### 결과
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```


#### 3. 예시: 중첩 배열 반복

배열 안에 배열이 중첩된 경우에 적합하며, 무한한 깊이로 중첩될 수 있습니다.

##### 데이터
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### 템플릿
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### 결과
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```


#### 4. 예시: 양방향 반복 (고급 기능, v4.8.0+)

양방향 반복은 행과 열을 동시에 순회할 수 있어 비교표 생성과 같은 복잡한 레이아웃에 적합합니다. (참고: 현재 일부 형식은 DOCX, HTML, MD 템플릿에서만 공식적으로 지원됩니다.)

##### 데이터
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### 템플릿
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### 결과
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```


#### 5. 예시: 반복 이터레이터 값 접근 (v4.0.0+)

반복문 내에서 현재 반복의 인덱스 값에 직접 접근할 수 있어 특별한 형식 요구사항을 충족하는 데 유용합니다.

##### 템플릿 예시
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> 참고: 점의 개수는 인덱스 레벨을 나타냅니다(예: `.i`는 현재 레벨, `..i`는 이전 레벨). 현재 역순 문제(reverse ordering issue)가 있으니, 자세한 내용은 공식 문서를 참조해 주세요.


### 객체 반복하기

#### 1. 구문 설명

- 객체의 속성(property)에 대해서는 `.att`를 사용하여 속성 이름을 가져오고, `.val`을 사용하여 속성 값을 가져올 수 있습니다.
- 반복 시 각 속성 항목이 하나씩 순회됩니다.

예시 구문 형식:
```
{d.objectName[i].att}  // 속성 이름
{d.objectName[i].val}  // 속성 값
```

#### 2. 예시: 객체 속성 반복

##### 데이터
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### 템플릿
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### 결과
```
People namePeople age
paul10
jack20
bob30
```


### 정렬 처리

정렬 기능을 사용하면 템플릿 내에서 배열 데이터를 직접 정렬할 수 있습니다.

#### 1. 구문 설명: 오름차순 정렬

- 반복 태그에서 속성을 정렬 기준으로 사용합니다. 구문 형식은 다음과 같습니다.
  ```
  {d.array[sortingAttribute, i].property}
  {d.array[sortingAttribute+1, i+1].property}
  ```
- 여러 정렬 기준이 필요한 경우, 대괄호 안에 여러 정렬 속성을 쉼표로 구분하여 지정할 수 있습니다.

#### 2. 예시: 숫자 속성으로 정렬하기

##### 데이터
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### 템플릿
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### 결과
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. 예시: 다중 속성 정렬

##### 데이터
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### 템플릿
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### 결과
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```


### 필터링 처리

필터링은 특정 조건에 따라 반복문 내의 데이터 행을 걸러내는 데 사용됩니다.

#### 1. 구문 설명: 숫자 필터링

- 반복 태그에 조건(예: `age > 19`)을 추가합니다. 구문 형식은 다음과 같습니다.
  ```
  {d.array[i, condition].property}
  ```

#### 2. 예시: 숫자 필터링

##### 데이터
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### 템플릿
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### 결과
```
People
John
Bob
```


#### 3. 구문 설명: 문자열 필터링

- 작은따옴표를 사용하여 문자열 조건을 지정합니다. 예시 형식:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. 예시: 문자열 필터링

##### 데이터
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### 템플릿
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### 결과
```
People
Falcon 9
Falcon Heavy
```


#### 5. 구문 설명: 처음 N개 항목 필터링

- 반복 인덱스 `i`를 사용하여 처음 N개의 요소를 필터링할 수 있습니다. 구문 예시:
  ```
  {d.array[i, i < N].property}
  ```

#### 6. 예시: 처음 두 항목 필터링

##### 데이터
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### 템플릿
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### 결과
```
People
Falcon 9
Model S
```


#### 7. 구문 설명: 마지막 N개 항목 제외

- 음수 인덱스 `i`를 사용하여 끝에서부터 항목을 나타낼 수 있습니다. 예를 들어:
  - `{d.array[i=-1].property}`는 마지막 항목을 가져옵니다.
  - `{d.array[i, i!=-1].property}`는 마지막 항목을 제외합니다.

#### 8. 예시: 마지막 항목과 마지막 두 항목 제외하기

##### 데이터
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### 템플릿
```
마지막 항목: {d[i=-1].name}

마지막 항목 제외:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

마지막 두 항목 제외:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### 결과
```
마지막 항목: Falcon Heavy

마지막 항목 제외:
Falcon 9
Model S
Model 3

마지막 두 항목 제외:
Falcon 9
Model S
```


#### 9. 구문 설명: 스마트 필터링

- 스마트 조건 블록을 사용하여 복잡한 조건에 따라 전체 행을 숨길 수 있습니다. 예시 형식:
  ```
  {d.array[i].property:ifIN('keyword'):drop(row)}
  ```

#### 10. 예시: 스마트 필터링

##### 데이터
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### 템플릿
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### 결과
```
People
Model S
Model 3
```
(참고: 템플릿에 "Falcon"이 포함된 행은 스마트 필터링 조건에 의해 제거됩니다.)


### 중복 제거 처리

#### 1. 구문 설명

- 사용자 정의 이터레이터(iterator)를 사용하여 특정 속성 값에 따라 고유한(중복되지 않는) 항목을 가져올 수 있습니다. 구문은 일반 반복문과 유사하지만, 중복되는 항목은 자동으로 무시됩니다.

예시 형식:
```
{d.array[property].property}
{d.array[property+1].property}
```

#### 2. 예시: 고유한 데이터 선택

##### 데이터
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### 템플릿
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### 결과
```
Vehicles
Hyundai
Airbus
```