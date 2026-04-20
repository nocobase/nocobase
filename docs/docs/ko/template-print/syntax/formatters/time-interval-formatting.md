:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/template-print/syntax/formatters/time-interval-formatting)을 참조하세요.
:::

### 시간 간격 형식화

#### 1. :formatI(patternOut, patternIn)

##### 구문 설명
기간 또는 간격을 형식화하며, 지원되는 출력 형식은 다음과 같습니다:
- `human+`, `human` (인간 친화적인 표시에 적합)
- 그리고 `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` 등의 단위(또는 그 약어).

매개변수:
- patternOut: 출력 형식 (예: `'second'`, `'human+'` 등)
- patternIn: 선택 사항, 입력 단위 (예: `'milliseconds'`, `'s'` 등)

##### 예시
```
2000:formatI('second')       // 출력 2
2000:formatI('seconds')      // 출력 2
2000:formatI('s')            // 출력 2
3600000:formatI('minute')    // 출력 60
3600000:formatI('hour')      // 출력 1
2419200000:formatI('days')   // 출력 28

// 인간 친화적인 표시:
2000:formatI('human')        // 출력 "a few seconds"
2000:formatI('human+')       // 출력 "in a few seconds"
-2000:formatI('human+')      // 출력 "a few seconds ago"

// 단위 변환 예시:
60:formatI('ms', 'minute')   // 출력 3600000
4:formatI('ms', 'weeks')      // 출력 2419200000
'P1M':formatI('ms')          // 출력 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // 출력 10296.085
```

##### 결과
출력 결과는 입력 값과 단위 변환에 따라 해당 기간 또는 간격으로 표시됩니다.