:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

### 시간 간격 포맷팅

#### 1. :formatI(patternOut, patternIn)

##### 구문 설명
기간 또는 간격을 포맷합니다. 지원되는 출력 형식은 다음과 같습니다:
- `human+` 또는 `human` (사용자 친화적인 표시에 적합합니다)
- 그리고 `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` 등과 같은 단위(또는 해당 약어)입니다.

매개변수:
- **patternOut:** 출력 형식입니다 (예: `'second'`, `'human+'` 등).
- **patternIn:** 선택 사항이며, 입력 단위입니다 (예: `'milliseconds'`, `'s'` 등).

##### 예시
```
// 예시 환경: API 옵션 { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // 출력: 2
2000:formatI('seconds')      // 출력: 2
2000:formatI('s')            // 출력: 2
3600000:formatI('minute')    // 출력: 60
3600000:formatI('hour')      // 출력: 1
2419200000:formatI('days')   // 출력: 28

// 프랑스어 예시:
2000:formatI('human')        // 출력: "quelques secondes"
2000:formatI('human+')       // 출력: "dans quelques secondes"
-2000:formatI('human+')      // 출력: "il y a quelques secondes"

// 영어 예시:
2000:formatI('human')        // 출력: "a few seconds"
2000:formatI('human+')       // 출력: "in a few seconds"
-2000:formatI('human+')      // 출력: "a few seconds ago"

// 단위 변환 예시:
60:formatI('ms', 'minute')   // 출력: 3600000
4:formatI('ms', 'weeks')      // 출력: 2419200000
'P1M':formatI('ms')          // 출력: 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // 출력: 10296.085
```

##### 결과
출력 결과는 입력 값과 단위 변환에 따라 해당 기간 또는 간격으로 표시됩니다.