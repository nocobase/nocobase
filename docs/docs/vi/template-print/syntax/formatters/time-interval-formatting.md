:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/template-print/syntax/formatters/time-interval-formatting).
:::

### Định dạng khoảng thời gian

#### 1. :formatI(patternOut, patternIn)

##### Giải thích cú pháp
Định dạng thời lượng hoặc khoảng thời gian, các định dạng đầu ra được hỗ trợ bao gồm:
- `human+`, `human` (phù hợp để hiển thị thân thiện với người dùng)
- Cũng như các đơn vị như `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (hoặc các dạng viết tắt của chúng).

Tham số:
- patternOut: Định dạng đầu ra (ví dụ: `'second'`, `'human+'`, v.v.)
- patternIn: Tùy chọn, đơn vị đầu vào (ví dụ: `'milliseconds'`, `'s'`, v.v.)

##### Ví dụ
```
2000:formatI('second')       // Kết quả 2
2000:formatI('seconds')      // Kết quả 2
2000:formatI('s')            // Kết quả 2
3600000:formatI('minute')    // Kết quả 60
3600000:formatI('hour')      // Kết quả 1
2419200000:formatI('days')   // Kết quả 28

// Hiển thị thân thiện với người dùng:
2000:formatI('human')        // Kết quả "a few seconds"
2000:formatI('human+')       // Kết quả "in a few seconds"
-2000:formatI('human+')      // Kết quả "a few seconds ago"

// Ví dụ chuyển đổi đơn vị:
60:formatI('ms', 'minute')   // Kết quả 3600000
4:formatI('ms', 'weeks')      // Kết quả 2419200000
'P1M':formatI('ms')          // Kết quả 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Kết quả 10296.085
```

##### Kết quả
Kết quả đầu ra hiển thị thời lượng hoặc khoảng thời gian tương ứng dựa trên giá trị đầu vào và chuyển đổi đơn vị.