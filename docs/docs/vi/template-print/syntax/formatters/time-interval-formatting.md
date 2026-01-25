:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


### Định dạng khoảng thời gian

#### 1. :formatI(patternOut, patternIn)

##### Mô tả cú pháp
Định dạng thời lượng hoặc khoảng thời gian. Các định dạng đầu ra được hỗ trợ bao gồm:
- `human+` hoặc `human` (phù hợp để hiển thị thân thiện với người dùng)
- Các đơn vị như `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (hoặc các dạng viết tắt của chúng).

Tham số:
- **patternOut:** Định dạng đầu ra (ví dụ: `'second'` hoặc `'human+'`).
- **patternIn:** Tùy chọn, đơn vị đầu vào (ví dụ: `'milliseconds'` hoặc `'s'`).

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Trả về 2
2000:formatI('seconds')      // Trả về 2
2000:formatI('s')            // Trả về 2
3600000:formatI('minute')    // Trả về 60
3600000:formatI('hour')      // Trả về 1
2419200000:formatI('days')   // Trả về 28

// Ví dụ tiếng Pháp:
2000:formatI('human')        // Trả về "quelques secondes"
2000:formatI('human+')       // Trả về "dans quelques secondes"
-2000:formatI('human+')      // Trả về "il y a quelques secondes"

// Ví dụ tiếng Anh:
2000:formatI('human')        // Trả về "a few seconds"
2000:formatI('human+')       // Trả về "in a few seconds"
-2000:formatI('human+')      // Trả về "a few seconds ago"

// Ví dụ chuyển đổi đơn vị:
60:formatI('ms', 'minute')   // Trả về 3600000
4:formatI('ms', 'weeks')      // Trả về 2419200000
'P1M':formatI('ms')          // Trả về 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Trả về 10296.085
```

##### Kết quả
Kết quả đầu ra sẽ hiển thị thời lượng hoặc khoảng thời gian tương ứng dựa trên giá trị đầu vào và quá trình chuyển đổi đơn vị.