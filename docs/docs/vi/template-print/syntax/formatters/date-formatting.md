:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


### Định dạng Ngày tháng

#### 1. :formatD(patternOut, patternIn)

##### Giải thích Cú pháp
Định dạng ngày tháng, chấp nhận mẫu định dạng đầu ra `patternOut` và mẫu định dạng đầu vào `patternIn` (mặc định là ISO 8601).
Bạn có thể điều chỉnh múi giờ và ngôn ngữ thông qua `options.timezone` và `options.lang`.

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "en-us", "timezone": "Europe/Paris" }
'20160131':formatD(L)      // Kết quả 01/31/2016
'20160131':formatD(LL)     // Kết quả January 31, 2016
'20160131':formatD(LLLL)   // Kết quả Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Kết quả Sunday

// Ví dụ tiếng Pháp:
'2017-05-10T15:57:23.769561+03:00':formatD(LLLL)  // Kết quả mercredi 10 mai 2017 14:57
'20160131':formatD(LLLL)   // Kết quả dimanche 31 janvier 2016 00:00
1410715640:formatD(LLLL, X) // Kết quả dimanche 14 septembre 2014 19:27
```

##### Kết quả
Kết quả là chuỗi ngày tháng được định dạng theo chỉ định.


#### 2. :addD(amount, unit, patternIn)

##### Giải thích Cú pháp
Thêm một lượng thời gian xác định vào ngày tháng. Các đơn vị được hỗ trợ bao gồm: day, week, month, quarter, year, hour, minute, second, millisecond.
Tham số:
- **amount:** Số lượng cần thêm.
- **unit:** Đơn vị thời gian (không phân biệt chữ hoa chữ thường).
- **patternIn:** Tùy chọn, định dạng đầu vào (mặc định là ISO8601).

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Kết quả "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Kết quả "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Kết quả "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Kết quả "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Kết quả "2016-04-30T00:00:00.000Z"
```

##### Kết quả
Kết quả là ngày tháng mới sau khi đã thêm thời gian.


#### 3. :subD(amount, unit, patternIn)

##### Giải thích Cú pháp
Trừ một lượng thời gian xác định khỏi ngày tháng. Các tham số tương tự như `addD`.

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Kết quả "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Kết quả "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Kết quả "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Kết quả "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Kết quả "2015-10-31T00:00:00.000Z"
```

##### Kết quả
Kết quả là ngày tháng mới sau khi đã trừ thời gian.


#### 4. :startOfD(unit, patternIn)

##### Giải thích Cú pháp
Đặt ngày tháng về thời điểm bắt đầu của đơn vị thời gian đã chỉ định.
Tham số:
- **unit:** Đơn vị thời gian.
- **patternIn:** Tùy chọn, định dạng đầu vào.

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Kết quả "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Kết quả "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Kết quả "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Kết quả "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Kết quả "2016-01-01T00:00:00.000Z"
```

##### Kết quả
Kết quả là chuỗi ngày tháng ở thời điểm bắt đầu.


#### 5. :endOfD(unit, patternIn)

##### Giải thích Cú pháp
Đặt ngày tháng về thời điểm kết thúc của đơn vị thời gian đã chỉ định.
Các tham số tương tự như `startOfD`.

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "fr", "timezone": "Europe/Paris" }
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Kết quả "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Kết quả "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Kết quả "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Kết quả "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Kết quả "2016-01-31T23:59:59.999Z"
```

##### Kết quả
Kết quả là chuỗi ngày tháng ở thời điểm kết thúc.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Giải thích Cú pháp
Tính toán sự khác biệt giữa hai ngày tháng và xuất ra theo đơn vị đã chỉ định. Các đơn vị đầu ra được hỗ trợ bao gồm:
- `day(s)` hoặc `d`
- `week(s)` hoặc `w`
- `quarter(s)` hoặc `Q`
- `month(s)` hoặc `M`
- `year(s)` hoặc `y`
- `hour(s)` hoặc `h`
- `minute(s)` hoặc `m`
- `second(s)` hoặc `s`
- `millisecond(s)` hoặc `ms` (đơn vị mặc định)

Tham số:
- **toDate:** Ngày tháng đích.
- **unit:** Đơn vị đầu ra.
- **patternFromDate:** Tùy chọn, định dạng của ngày tháng bắt đầu.
- **patternToDate:** Tùy chọn, định dạng của ngày tháng đích.

##### Ví dụ
```
'20101001':diffD('20101201')              // Kết quả 5270400000
'20101001':diffD('20101201', 'second')      // Kết quả 5270400
'20101001':diffD('20101201', 's')           // Kết quả 5270400
'20101001':diffD('20101201', 'm')           // Kết quả 87840
'20101001':diffD('20101201', 'h')           // Kết quả 1464
'20101001':diffD('20101201', 'weeks')       // Kết quả 8
'20101001':diffD('20101201', 'days')        // Kết quả 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Kết quả 5270400000
```

##### Kết quả
Kết quả là sự khác biệt thời gian giữa hai ngày tháng, được chuyển đổi theo đơn vị đã chỉ định.


#### 7. :convDate(patternIn, patternOut)

##### Giải thích Cú pháp
Chuyển đổi ngày tháng từ định dạng này sang định dạng khác (không khuyến nghị sử dụng).
Tham số:
- **patternIn:** Định dạng ngày tháng đầu vào.
- **patternOut:** Định dạng ngày tháng đầu ra.

##### Ví dụ
```
// Môi trường ví dụ: Tùy chọn API { "lang": "en", "timezone": "Europe/Paris" }
'20160131':convDate('YYYYMMDD', 'L')      // Kết quả "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Kết quả "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Kết quả "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Kết quả "Sunday"
1410715640:convDate('X', 'LLLL')          // Kết quả "Sunday, September 14, 2014 7:27 PM"
// Ví dụ tiếng Pháp:
'20160131':convDate('YYYYMMDD', 'LLLL')   // Kết quả "dimanche 31 janvier 2016 00:00"
'20160131':convDate('YYYYMMDD', 'dddd')   // Kết quả "dimanche"
```

##### Kết quả
Kết quả là chuỗi ngày tháng đã được chuyển đổi.


#### 8. Các Mẫu Định dạng Ngày tháng
Mô tả các ký hiệu định dạng ngày tháng phổ biến (tham khảo tài liệu DayJS):
- `X`: Dấu thời gian Unix (tính bằng giây), ví dụ: 1360013296
- `x`: Dấu thời gian Unix tính bằng mili giây, ví dụ: 1360013296123
- `YY`: Năm hai chữ số, ví dụ: 18
- `YYYY`: Năm bốn chữ số, ví dụ: 2018
- `M`, `MM`, `MMM`, `MMMM`: Tháng (số, hai chữ số, viết tắt, tên đầy đủ)
- `D`, `DD`: Ngày (số, hai chữ số)
- `d`, `dd`, `ddd`, `dddd`: Thứ trong tuần (số, tối giản, viết tắt, tên đầy đủ)
- `H`, `HH`, `h`, `hh`: Giờ (định dạng 24 giờ hoặc 12 giờ)
- `m`, `mm`: Phút
- `s`, `ss`: Giây
- `SSS`: Mili giây (3 chữ số)
- `Z`, `ZZ`: Độ lệch UTC, ví dụ: +05:00 hoặc +0500
- `A`, `a`: AM/PM
- `Q`: Quý (1-4)
- `Do`: Ngày trong tháng có hậu tố thứ tự, ví dụ: 1st, 2nd, …
- Đối với các định dạng khác, vui lòng tham khảo tài liệu đầy đủ.
  Ngoài ra, còn có các định dạng được bản địa hóa theo ngôn ngữ như `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, v.v.