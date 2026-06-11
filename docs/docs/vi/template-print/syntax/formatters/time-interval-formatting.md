---
title: "Template In ấn - Định dạng khoảng thời gian"
description: "Formatter Định dạng khoảng thời gian Template In ấn: formatI để Định dạng thời lượng, hỗ trợ định dạng đầu ra như human, second, minute..."
keywords: "Template In ấn,Khoảng thời gian,formatI,NocoBase"
---

### Định dạng khoảng thời gian

#### 1. :formatI(patternOut, patternIn)

##### Mô tả cú pháp
Định dạng thời lượng hoặc khoảng thời gian, các định dạng đầu ra được hỗ trợ bao gồm:
- `human+`, `human` (phù hợp hiển thị tự nhiên)
- Cùng với các đơn vị `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)`... (hoặc viết tắt của chúng).

Tham số:
- patternOut: Định dạng đầu ra (ví dụ `'second'`, `'human+'`...)
- patternIn: Tùy chọn, đơn vị đầu vào (ví dụ `'milliseconds'`, `'s'`...)

##### Ví dụ
```
2000:formatI('second')       // Output 2
2000:formatI('seconds')      // Output 2
2000:formatI('s')            // Output 2
3600000:formatI('minute')    // Output 60
3600000:formatI('hour')      // Output 1
2419200000:formatI('days')   // Output 28

// Hiển thị tự nhiên:
2000:formatI('human')        // Output "a few seconds"
2000:formatI('human+')       // Output "in a few seconds"
-2000:formatI('human+')      // Output "a few seconds ago"

// Ví dụ chuyển đổi đơn vị:
60:formatI('ms', 'minute')   // Output 3600000
4:formatI('ms', 'weeks')      // Output 2419200000
'P1M':formatI('ms')          // Output 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Output 10296.085
```

##### Kết quả
Kết quả đầu ra theo giá trị đầu vào và chuyển đổi đơn vị hiển thị thời lượng hoặc khoảng thời gian tương ứng.


