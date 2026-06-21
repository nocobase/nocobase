---
title: "Template In ấn - Định dạng ngày"
description: "Formatter Định dạng ngày Template In ấn: formatD theo patternOut/patternIn để Định dạng ngày, hỗ trợ định dạng YYYY-MM-DD, HH:mm..."
keywords: "Template In ấn,Định dạng ngày,formatD,NocoBase"
---

### Định dạng ngày

#### 1. :formatD(patternOut, patternIn)

##### Mô tả cú pháp
Định dạng ngày, nhận định dạng đầu ra `patternOut`, định dạng đầu vào `patternIn` (mặc định là ISO 8601).

##### Ví dụ thường dùng
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Output 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Output 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Output 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Output 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Output 1月15日
{d.meetingTime:formatD(HH:mm)}              // Output 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Output 2024年1月15日 星期一
```

##### Ví dụ định dạng khác
```
'20160131':formatD(L)      // Output 01/31/2016
'20160131':formatD(LL)     // Output January 31, 2016
'20160131':formatD(LLLL)   // Output Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Output Sunday
```

##### Kết quả
Đầu ra là chuỗi ngày được Định dạng theo định dạng chỉ định.


#### 2. :addD(amount, unit, patternIn)

##### Mô tả cú pháp
Thêm khoảng thời gian chỉ định vào ngày. Hỗ trợ đơn vị: day, week, month, quarter, year, hour, minute, second, millisecond.
Tham số:
- amount: Số lượng thêm
- unit: Đơn vị thời gian (không phân biệt hoa thường)
- patternIn: Tùy chọn, định dạng đầu vào, mặc định là ISO8601

##### Ví dụ
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Output "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Output "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Output "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Output "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Output "2016-04-30T00:00:00.000Z"
```

##### Kết quả
Đầu ra là ngày mới sau khi thêm thời gian.


#### 3. :subD(amount, unit, patternIn)

##### Mô tả cú pháp
Trừ khoảng thời gian chỉ định khỏi ngày. Tham số giống `addD`.

##### Ví dụ
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Output "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Output "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Output "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Output "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Output "2015-10-31T00:00:00.000Z"
```

##### Kết quả
Đầu ra là ngày mới sau khi trừ thời gian.


#### 4. :startOfD(unit, patternIn)

##### Mô tả cú pháp
Đặt ngày về thời điểm bắt đầu của đơn vị thời gian chỉ định.
Tham số:
- unit: Đơn vị thời gian
- patternIn: Tùy chọn, định dạng đầu vào

##### Ví dụ
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Output "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Output "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Output "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Output "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Output "2016-01-01T00:00:00.000Z"
```

##### Kết quả
Đầu ra là chuỗi ngày của thời điểm bắt đầu.


#### 5. :endOfD(unit, patternIn)

##### Mô tả cú pháp
Đặt ngày về thời điểm kết thúc của đơn vị thời gian chỉ định.
Tham số như trên.

##### Ví dụ
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Output "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Output "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Output "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Output "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Output "2016-01-31T23:59:59.999Z"
```

##### Kết quả
Đầu ra là chuỗi ngày của thời điểm kết thúc.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Mô tả cú pháp
Tính chênh lệch giữa hai ngày, và xuất ra theo đơn vị chỉ định. Đơn vị đầu ra được hỗ trợ bao gồm:
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
- toDate: Ngày đích
- unit: Đơn vị đầu ra
- patternFromDate: Tùy chọn, định dạng ngày bắt đầu
- patternToDate: Tùy chọn, định dạng ngày đích

##### Ví dụ
```
'20101001':diffD('20101201')              // Output 5270400000
'20101001':diffD('20101201', 'second')      // Output 5270400
'20101001':diffD('20101201', 's')           // Output 5270400
'20101001':diffD('20101201', 'm')           // Output 87840
'20101001':diffD('20101201', 'h')           // Output 1464
'20101001':diffD('20101201', 'weeks')       // Output 8
'20101001':diffD('20101201', 'days')        // Output 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Output 5270400000
```

##### Kết quả
Đầu ra là chênh lệch thời gian giữa hai ngày, đơn vị được chuyển đổi theo chỉ định.


#### 7. :convDate(patternIn, patternOut)

##### Mô tả cú pháp
Chuyển ngày từ định dạng này sang định dạng khác. (Không khuyến nghị sử dụng)
Tham số:
- patternIn: Định dạng ngày đầu vào
- patternOut: Định dạng ngày đầu ra

##### Ví dụ
```
'20160131':convDate('YYYYMMDD', 'L')      // Output "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Output "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Output "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Output "Sunday"
1410715640:convDate('X', 'LLLL')          // Output "Sunday, September 14, 2014 7:27 PM"
```

##### Kết quả
Đầu ra là chuỗi ngày sau khi chuyển đổi.


#### 8. Mẫu Định dạng ngày
Mô tả Định dạng ngày thường dùng (tham khảo mô tả DayJS):
- `X`: Unix timestamp (giây), như 1360013296
- `x`: Unix timestamp mili giây, như 1360013296123
- `YY`: Năm hai chữ số, như 18
- `YYYY`: Năm bốn chữ số, như 2018
- `M`, `MM`, `MMM`, `MMMM`: Tháng (số, hai chữ số, viết tắt, tên đầy đủ)
- `D`, `DD`: Ngày (số, hai chữ số)
- `d`, `dd`, `ddd`, `dddd`: Thứ (số, ngắn nhất, viết tắt, tên đầy đủ)
- `H`, `HH`, `h`, `hh`: Giờ (định dạng 24 giờ hoặc 12 giờ)
- `m`, `mm`: Phút
- `s`, `ss`: Giây
- `SSS`: Mili giây (3 chữ số)
- `Z`, `ZZ`: Lệch UTC, như +05:00 hoặc +0500
- `A`, `a`: AM/PM
- `Q`: Quý (1-4)
- `Do`: Ngày có thứ tự, như 1st, 2nd, …
- Các định dạng khác xem tài liệu đầy đủ.
  Ngoài ra, còn có định dạng bản địa hóa dựa trên ngôn ngữ: như `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`...


