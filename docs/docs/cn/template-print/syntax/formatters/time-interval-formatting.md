### 时间间隔格式化

#### 1. :formatI(patternOut, patternIn)

##### 语法说明
格式化时长或间隔，支持的输出格式包括：
- `human+`、`human`（适合人性化显示）
- 以及 `millisecond(s)`、`second(s)`、`minute(s)`、`hour(s)`、`year(s)`、`month(s)`、`week(s)`、`day(s)` 等单位（或其简写）。

参数：
- patternOut：输出格式（例如 `'second'`、`'human+'` 等）
- patternIn：可选，输入单位（例如 `'milliseconds'`、`'s'` 等）

##### 示例
```
2000:formatI('second')       // 输出 2
2000:formatI('seconds')      // 输出 2
2000:formatI('s')            // 输出 2
3600000:formatI('minute')    // 输出 60
3600000:formatI('hour')      // 输出 1
2419200000:formatI('days')   // 输出 28

// 人性化显示：
2000:formatI('human')        // 输出 "a few seconds"
2000:formatI('human+')       // 输出 "in a few seconds"
-2000:formatI('human+')      // 输出 "a few seconds ago"

// 单位转换示例：
60:formatI('ms', 'minute')   // 输出 3600000
4:formatI('ms', 'weeks')      // 输出 2419200000
'P1M':formatI('ms')          // 输出 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // 输出 10296.085
```

##### 结果
输出结果根据输入值和单位转换显示为相应的时长或间隔。


