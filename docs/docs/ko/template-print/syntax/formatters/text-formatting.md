:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

### 텍스트 서식 지정

이 섹션에서는 텍스트 데이터에 사용할 수 있는 다양한 서식 지정 도구(formatter)를 제공합니다. 아래에서는 각 서식 지정 도구의 문법, 예시, 그리고 결과에 대해 차례로 설명합니다.

#### 1. :lowerCase

##### 문법 설명
모든 문자를 소문자로 변환합니다.

##### 예시
```
'My Car':lowerCase()   // 결과: "my car"
'my car':lowerCase()   // 결과: "my car"
null:lowerCase()       // 결과: null
1203:lowerCase()       // 결과: 1203
```

##### 결과
각 예시의 출력 결과는 주석에 표시된 바와 같습니다.


#### 2. :upperCase

##### 문법 설명
모든 문자를 대문자로 변환합니다.

##### 예시
```
'My Car':upperCase()   // 결과: "MY CAR"
'my car':upperCase()   // 결과: "MY CAR"
null:upperCase()       // 결과: null
1203:upperCase()       // 결과: 1203
```

##### 결과
각 예시의 출력 결과는 주석에 표시된 바와 같습니다.


#### 3. :ucFirst

##### 문법 설명
문자열의 첫 글자만 대문자로 변환하고, 나머지는 그대로 유지합니다.

##### 예시
```
'My Car':ucFirst()     // 결과: "My Car"
'my car':ucFirst()     // 결과: "My car"
null:ucFirst()         // 결과: null
undefined:ucFirst()    // 결과: undefined
1203:ucFirst()         // 결과: 1203
```

##### 결과
출력 결과는 주석에 설명된 바와 같습니다.


#### 4. :ucWords

##### 문법 설명
문자열 내 각 단어의 첫 글자를 대문자로 변환합니다.

##### 예시
```
'my car':ucWords()     // 결과: "My Car"
'My cAR':ucWords()     // 결과: "My CAR"
null:ucWords()         // 결과: null
undefined:ucWords()    // 결과: undefined
1203:ucWords()         // 결과: 1203
```

##### 결과
출력 결과는 예시에 표시된 바와 같습니다.


#### 5. :print(message)

##### 문법 설명
원래 데이터와 관계없이 항상 지정된 메시지를 반환합니다. 이는 대체 서식 지정 도구로 유용하게 사용될 수 있습니다.
매개변수:
- message: 출력할 텍스트

##### 예시
```
'My Car':print('hello!')   // 결과: "hello!"
'my car':print('hello!')   // 결과: "hello!"
null:print('hello!')       // 결과: "hello!"
1203:print('hello!')       // 결과: "hello!"
```

##### 결과
모든 경우에 지정된 "hello!" 문자열을 반환합니다.


#### 6. :printJSON

##### 문법 설명
객체 또는 배열을 JSON 형식의 문자열로 변환하여 출력합니다.

##### 예시
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// 결과: "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // 결과: ""my car""
```

##### 결과
예시의 출력 결과는 변환된 JSON 문자열입니다.


#### 7. :unaccent

##### 문법 설명
텍스트에서 발음 구별 부호를 제거하여 무악센트 형식으로 변환합니다.

##### 예시
```
'crÃ¨me brulÃ©e':unaccent()   // 결과: "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // 결과: "CREME BRULEE"
'Ãªtre':unaccent()           // 결과: "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // 결과: "euieea"
```

##### 결과
각 예시의 출력 결과는 발음 구별 부호가 제거된 텍스트입니다.


#### 8. :convCRLF

##### 문법 설명
텍스트 내의 캐리지 리턴 및 줄 바꿈 문자(`\r\n` 또는 `\n`)를 문서별 줄 바꿈 태그로 변환합니다. 이는 DOCX, PPTX, ODT, ODP, ODS와 같은 형식에 유용합니다.
참고: `:convCRLF` 서식 지정 도구 이전에 `:html`을 사용할 경우, `\r\n`은 `<br>` 태그로 변환됩니다.

##### 예시
```
// ODT 형식의 경우:
'my blue 
 car':convCRLF()    // 결과: "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // 결과: "my blue <text:line-break/> car"

// DOCX 형식의 경우:
'my blue 
 car':convCRLF()    // 결과: "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // 결과: "my blue </w:t><w:br/><w:t> car"
```

##### 결과
출력 결과는 대상 문서 형식에 적합한 줄 바꿈 태그를 보여줍니다.


#### 9. :substr(begin, end, wordMode)

##### 문법 설명
문자열을 자르는 작업을 수행합니다. `begin` 인덱스(0부터 시작)에서 시작하여 `end` 인덱스 바로 앞에서 끝납니다.
선택적 매개변수 `wordMode`(부울 값 또는 `last`)는 단어 중간에 끊기지 않고 단어의 완전성을 유지할지 여부를 제어합니다.

##### 예시
```
'foobar':substr(0, 3)            // 결과: "foo"
'foobar':substr(1)               // 결과: "oobar"
'foobar':substr(-2)              // 결과: "ar"
'foobar':substr(2, -1)           // 결과: "oba"
'abcd efg hijklm':substr(0, 11, true)  // 결과: "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // 결과: "abcd efg "
```

##### 결과
매개변수에 따라 추출된 해당 문자열 조각을 출력합니다.


#### 10. :split(delimiter)

##### 문법 설명
지정된 구분자(`delimiter`)를 사용하여 문자열을 배열로 분할합니다.
매개변수:
- delimiter: 구분자 문자열

##### 예시
```
'abcdefc12':split('c')    // 결과: ["ab", "def", "12"]
1222.1:split('.')         // 결과: ["1222", "1"]
'ab/cd/ef':split('/')      // 결과: ["ab", "cd", "ef"]
```

##### 결과
예시 결과는 주어진 구분자로 분할된 배열입니다.


#### 11. :padl(targetLength, padString)

##### 문법 설명
최종 문자열 길이가 `targetLength`에 도달할 때까지 문자열의 왼쪽에 지정된 문자를 채웁니다.
만약 목표 길이가 원래 문자열 길이보다 작으면 원래 문자열이 반환됩니다.
매개변수:
- targetLength: 목표 총 길이
- padString: 채우는 데 사용될 문자열 (기본값은 공백)

##### 예시
```
'abc':padl(10)              // 결과: "       abc"
'abc':padl(10, 'foo')       // 결과: "foofoofabc"
'abc':padl(6, '123465')     // 결과: "123abc"
'abc':padl(8, '0')          // 결과: "00000abc"
'abc':padl(1)               // 결과: "abc"
```

##### 결과
각 예시는 왼쪽에 채워진 문자열을 출력합니다.


#### 12. :padr(targetLength, padString)

##### 문법 설명
최종 문자열 길이가 `targetLength`에 도달할 때까지 문자열의 오른쪽에 지정된 문자를 채웁니다.
매개변수는 위와 동일합니다.

##### 예시
```
'abc':padr(10)              // 결과: "abc       "
'abc':padr(10, 'foo')       // 결과: "abcfoofoof"
'abc':padr(6, '123465')     // 결과: "abc123"
'abc':padr(8, '0')          // 결과: "abc00000"
'abc':padr(1)               // 결과: "abc"
```

##### 결과
출력 결과는 오른쪽에 채워진 문자열을 보여줍니다.


#### 13. :ellipsis(maximum)

##### 문법 설명
텍스트가 지정된 문자 수를 초과하면 끝에 줄임표("...")를 추가합니다.
매개변수:
- maximum: 허용되는 최대 문자 수

##### 예시
```
'abcdef':ellipsis(3)      // 결과: "abc..."
'abcdef':ellipsis(6)      // 결과: "abcdef"
'abcdef':ellipsis(10)     // 결과: "abcdef"
```

##### 결과
예시 결과는 필요한 경우 줄임표가 추가되어 잘린 텍스트를 보여줍니다.


#### 14. :prepend(textToPrepend)

##### 문법 설명
텍스트 앞에 지정된 접두사를 추가합니다.
매개변수:
- textToPrepend: 접두사 텍스트

##### 예시
```
'abcdef':prepend('123')     // 결과: "123abcdef"
```

##### 결과
출력 결과는 지정된 접두사가 추가된 문자열입니다.


#### 15. :append(textToAppend)

##### 문법 설명
텍스트 뒤에 지정된 접미사를 추가합니다.
매개변수:
- textToAppend: 접미사 텍스트

##### 예시
```
'abcdef':append('123')      // 결과: "abcdef123"
```

##### 결과
출력 결과는 지정된 접미사가 추가된 문자열입니다.


#### 16. :replace(oldText, newText)

##### 문법 설명
텍스트 내의 모든 일치하는 `oldText`를 `newText`로 바꿉니다.
매개변수:
- oldText: 바꿀 이전 텍스트
- newText: 바꿀 새 텍스트
참고: `newText`가 null이면 일치하는 항목을 삭제함을 의미합니다.

##### 예시
```
'abcdef abcde':replace('cd', 'OK')    // 결과: "abOKef abOKe"
'abcdef abcde':replace('cd')          // 결과: "abef abe"
'abcdef abcde':replace('cd', null)      // 결과: "abef abe"
'abcdef abcde':replace('cd', 1000)      // 결과: "ab1000ef ab1000e"
```

##### 결과
출력 결과는 지정된 부분을 바꾼 후의 문자열입니다.


#### 17. :len

##### 문법 설명
문자열 또는 배열의 길이를 반환합니다.

##### 예시
```
'Hello World':len()     // 결과: 11
'':len()                // 결과: 0
[1,2,3,4,5]:len()       // 결과: 5
[1,'Hello']:len()       // 결과: 2
```

##### 결과
해당 길이 값을 숫자로 출력합니다.


#### 18. :t

##### 문법 설명
번역 사전에 따라 텍스트를 번역합니다.
예시 및 결과는 실제 번역 사전 구성에 따라 달라집니다.


#### 19. :preserveCharRef

##### 문법 설명
기본적으로 XML의 특정 유효하지 않은 문자(&, >, < 등)는 제거됩니다. 이 서식 지정 도구는 문자 참조(예: `&#xa7;`는 변경되지 않고 유지됨)를 보존하며, 특정 XML 생성 시나리오에 적합합니다.
예시 및 결과는 특정 사용 사례에 따라 달라집니다.