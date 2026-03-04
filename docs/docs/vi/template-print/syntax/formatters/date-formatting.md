:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/template-print/syntax/formatters/date-formatting).
:::

### Định dạng ngày tháng

#### 1. :formatD(patternOut, patternIn)

##### Giải thích cú pháp
Định dạng ngày tháng, chấp nhận mẫu định dạng đầu ra `patternOut`, mẫu định dạng đầu vào `patternIn` (mặc định là ISO 8601).

##### Ví dụ thường dùng
```
{d.createdAt:formatD(YYYY-MM-DD)}           // Đầu ra 2024-01-15
{d.createdAt:formatD(YYYY年M月D日)}          // Đầu ra 2024年1月15日
{d.updatedAt:formatD(YYYY年M月D日 HH:mm)}    // Đầu ra 2024年1月15日 14:30
{d.orderDate:formatD(YYYY/MM/DD HH:mm:ss)}  // Đầu ra 2024/01/15 14:30:25
{d.birthday:formatD(M月D日)}                 // Đầu ra 1月15日
{d.meetingTime:formatD(HH:mm)}              // Đầu ra 14:30
{d.deadline:formatD(YYYY年M月D日 dddd)}      // Đầu ra 2024年1月15日 星期一
```

##### Thêm ví dụ về định dạng
```
'20160131':formatD(L)      // Đầu ra 01/31/2016
'20160131':formatD(LL)     // Đầu ra January 31, 2016
'20160131':formatD(LLLL)   // Đầu ra Sunday, January 31, 2016 12:00 AM
'20160131':formatD(dddd)   // Đầu ra Sunday
```

##### Kết quả
Đầu ra là chuỗi ngày tháng theo định dạng chỉ định.


#### 2. :addD(amount, unit, patternIn)

##### Giải thích cú pháp
Thêm một lượng thời gian chỉ định vào ngày tháng. Các đơn vị hỗ trợ: day, week, month, quarter, year, hour, minute, second, millisecond.  
Tham số:
- amount: Số lượng cần thêm
- unit: Đơn vị thời gian (không phân biệt chữ hoa chữ thường)
- patternIn: Tùy chọn, định dạng đầu vào, mặc định là ISO8601

##### Ví dụ
```
'2017-05-10T15:57:23.769561+03:00':addD('3', 'day')    // Đầu ra "2017-05-13T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':addD('3', 'month')      // Đầu ra "2017-08-10T12:57:23.769Z"
'20160131':addD('3', 'day')       // Đầu ra "2016-02-03T00:00:00.000Z"
'20160131':addD('3', 'month')     // Đầu ra "2016-04-30T00:00:00.000Z"
'31-2016-01':addD('3', 'month', 'DD-YYYY-MM')  // Đầu ra "2016-04-30T00:00:00.000Z"
```

##### Kết quả
Đầu ra là ngày tháng mới sau khi thêm thời gian.


#### 3. :subD(amount, unit, patternIn)

##### Giải thích cú pháp
Trừ một lượng thời gian chỉ định khỏi ngày tháng. Tham số tương tự như `addD`.

##### Ví dụ
```
'2017-05-10T15:57:23.769561+03:00':subD('3', 'day')    // Đầu ra "2017-05-07T12:57:23.769Z"
'2017-05-10 15:57:23.769561+03:00':subD('3', 'month')      // Đầu ra "2017-02-10T12:57:23.769Z"
'20160131':subD('3', 'day')       // Đầu ra "2016-01-28T00:00:00.000Z"
'20160131':subD('3', 'month')     // Đầu ra "2015-10-31T00:00:00.000Z"
'31-2016-01':subD('3', 'month', 'DD-YYYY-MM')  // Đầu ra "2015-10-31T00:00:00.000Z"
```

##### Kết quả
Đầu ra là ngày tháng mới sau khi trừ thời gian.


#### 4. :startOfD(unit, patternIn)

##### Giải thích cú pháp
Đặt ngày tháng về thời điểm bắt đầu của đơn vị thời gian chỉ định.  
Tham số:
- unit: Đơn vị thời gian
- patternIn: Tùy chọn, định dạng đầu vào

##### Ví dụ
```
'2017-05-10T15:57:23.769561+03:00':startOfD('day')    // Đầu ra "2017-05-10T00:00:00.000Z"
'2017-05-10 15:57:23.769561+03:00':startOfD('month')      // Đầu ra "2017-05-01T00:00:00.000Z"
'20160131':startOfD('day')       // Đầu ra "2016-01-31T00:00:00.000Z"
'20160131':startOfD('month')     // Đầu ra "2016-01-01T00:00:00.000Z"
'31-2016-01':startOfD('month', 'DD-YYYY-MM')  // Đầu ra "2016-01-01T00:00:00.000Z"
```

##### Kết quả
Đầu ra là chuỗi ngày tháng tại thời điểm bắt đầu.


#### 5. :endOfD(unit, patternIn)

##### Giải thích cú pháp
Đặt ngày tháng về thời điểm kết thúc của đơn vị thời gian chỉ định.  
Tham số tương tự như trên.

##### Ví dụ
```
'2017-05-10T15:57:23.769561+03:00':endOfD('day')    // Đầu ra "2017-05-10T23:59:59.999Z"
'2017-05-10 15:57:23.769561+03:00':endOfD('month')      // Đầu ra "2017-05-31T23:59:59.999Z"
'20160131':endOfD('day')       // Đầu ra "2016-01-31T23:59:59.999Z"
'20160131':endOfD('month')     // Đầu ra "2016-01-31T23:59:59.999Z"
'31-2016-01':endOfD('month', 'DD-YYYY-MM')  // Đầu ra "2016-01-31T23:59:59.999Z"
```

##### Kết quả
Đầu ra là chuỗi ngày tháng tại thời điểm kết thúc.


#### 6. :diffD(toDate, unit, patternFromDate, patternToDate)

##### Giải thích cú pháp
Tính toán chênh lệch giữa hai ngày tháng và đầu ra theo đơn vị chỉ định. Các đơn vị đầu ra hỗ trợ bao gồm:
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
- toDate: Ngày tháng đích
- unit: Đơn vị đầu ra
- patternFromDate: Tùy chọn, định dạng ngày bắt đầu
- patternToDate: Tùy chọn, định dạng ngày đích

##### Ví dụ
```
'20101001':diffD('20101201')              // Đầu ra 5270400000
'20101001':diffD('20101201', 'second')      // Đầu ra 5270400
'20101001':diffD('20101201', 's')           // Đầu ra 5270400
'20101001':diffD('20101201', 'm')           // Đầu ra 87840
'20101001':diffD('20101201', 'h')           // Đầu ra 1464
'20101001':diffD('20101201', 'weeks')       // Đầu ra 8
'20101001':diffD('20101201', 'days')        // Đầu ra 61
'2010+10+01':diffD('2010=12=01', 'ms', 'YYYY+MM+DD', 'YYYY=MM=DD')  // Đầu ra 5270400000
```

##### Kết quả
Đầu ra là chênh lệch thời gian giữa hai ngày tháng, đơn vị được chuyển đổi theo chỉ định.


#### 7. :convDate(patternIn, patternOut)

##### Giải thích cú pháp
Chuyển đổi ngày tháng từ định dạng này sang định dạng khác. (Không khuyến nghị sử dụng)  
Tham số:
- patternIn: Định dạng ngày tháng đầu vào
- patternOut: Định dạng ngày tháng đầu ra

##### Ví dụ
```
'20160131':convDate('YYYYMMDD', 'L')      // Đầu ra "01/31/2016"
'20160131':convDate('YYYYMMDD', 'LL')     // Đầu ra "January 31, 2016"
'20160131':convDate('YYYYMMDD', 'LLLL')   // Đầu ra "Sunday, January 31, 2016 12:00 AM"
'20160131':convDate('YYYYMMDD', 'dddd')   // Đầu ra "Sunday"
1410715640:convDate('X', 'LLLL')          // Đầu ra "Sunday, September 14, 2014 7:27 PM"
```

##### Kết quả
Đầu ra là chuỗi ngày tháng đã chuyển đổi.


#### 8. Mẫu định dạng ngày tháng
Mô tả các mẫu định dạng ngày tháng thường dùng (tham khảo mô tả DayJS):
- `X`: Dấu thời gian Unix (giây), ví dụ 1360013296
- `x`: Dấu thời gian Unix mili giây, ví dụ 1360013296123
- `YY`: Năm hai chữ số, ví dụ 18
- `YYYY`: Năm bốn chữ số, ví dụ 2018
- `M`, `MM`, `MMM`, `MMMM`: Tháng (số, hai chữ số, viết tắt, tên đầy đủ)
- `D`, `DD`: Ngày (số, hai chữ số)
- `d`, `dd`, `ddd`, `dddd`: Thứ (số, tối giản, viết tắt, tên đầy đủ)
- `H`, `HH`, `h`, `hh`: Giờ (hệ 24 giờ hoặc hệ 12 giờ)
- `m`, `mm`: Phút
- `s`, `ss`: Giây
- `SSS`: Mili giây (3 chữ số)
- `Z`, `ZZ`: Độ lệch UTC, ví dụ +05:00 hoặc +0500
- `A`, `a`: AM/PM
- `Q`: Quý (1-4)
- `Do`: Ngày kèm số thứ tự, ví dụ 1st, 2nd, …
- Các định dạng khác vui lòng xem tài liệu đầy đủ.  
  Ngoài ra, còn có các định dạng bản địa hóa dựa trên ngôn ngữ: như `LT`, `LTS`, `L`, `LL`, `LLL`, `LLLL`, v.v.