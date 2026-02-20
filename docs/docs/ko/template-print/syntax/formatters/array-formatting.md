:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

### 배열 형식 지정

#### 1. :arrayJoin(separator, index, count)

##### 구문 설명
문자열 또는 숫자 배열을 하나의 문자열로 결합합니다.  
매개변수:
- `separator`: 구분자 (기본값은 쉼표 `,`입니다.)
- `index`: 선택 사항입니다. 결합을 시작할 인덱스입니다.
- `count`: 선택 사항입니다. `index`부터 결합할 항목의 개수입니다. (음수를 사용하여 끝에서부터 계산할 수 있습니다.)

##### 예시
```
['homer','bart','lisa']:arrayJoin()              // 출력 "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // 출력 "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // 출력 "homerbartlisa"
[10,50]:arrayJoin()                               // 출력 "10, 50"
[]:arrayJoin()                                    // 출력 ""
null:arrayJoin()                                  // 출력 null
{}:arrayJoin()                                    // 출력 {}
20:arrayJoin()                                    // 출력 20
undefined:arrayJoin()                             // 출력 undefined
['homer','bart','lisa']:arrayJoin('', 1)          // 출력 "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // 출력 "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // 출력 "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // 출력 "homerbart"
```

##### 결과
지정된 매개변수에 따라 배열 요소를 결합하여 생성된 문자열이 출력됩니다.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### 구문 설명
객체 배열을 문자열로 변환합니다. 중첩된 객체나 배열은 처리하지 않습니다.  
매개변수:
- `objSeparator`: 객체 간 구분자 (기본값은 `, `입니다.)
- `attSeparator`: 객체 속성 간 구분자 (기본값은 `:`입니다.)
- `attributes`: 선택 사항입니다. 출력할 객체 속성 목록을 지정합니다.

##### 예시
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// 출력 "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// 출력 "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// 출력 "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// 출력 "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// 출력 "2:homer"

['homer','bart','lisa']:arrayMap()    // 출력 "homer, bart, lisa"
[10,50]:arrayMap()                    // 출력 "10, 50"
[]:arrayMap()                         // 출력 ""
null:arrayMap()                       // 출력 null
{}:arrayMap()                         // 출력 {}
20:arrayMap()                         // 출력 20
undefined:arrayMap()                  // 출력 undefined
```

##### 결과
배열 요소를 매핑하고 결합하여 생성된 문자열이 출력되며, 객체 내 중첩된 내용은 무시됩니다.

#### 3. :count(start)

##### 구문 설명
배열의 행 번호를 세고 현재 행 번호를 출력합니다.  
예를 들어:
```
{d[i].id:count()}
```  
`id` 값과 관계없이 현재 행 수를 출력합니다.  
v4.0.0부터 이 포맷터는 내부적으로 `:cumCount`로 대체되었습니다.

매개변수:
- `start`: 선택 사항입니다. 카운트의 시작 값입니다.

##### 예시 및 결과
실제로 사용할 때, 출력되는 행 번호는 배열 요소의 순서에 따라 표시됩니다.