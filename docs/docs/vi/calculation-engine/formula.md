---
title: "Formula.js"
description: "Formula.js tương thích công thức Excel: hàm ngày tháng, tài chính, kỹ thuật, logic, toán học, thống kê, văn bản, dùng cho field công thức, quy tắc liên kết, tính toán workflow."
keywords: "Formula.js,Excel formula,hàm ngày tháng,hàm toán học,hàm thống kê,hàm tài chính,NocoBase"
---

# Formula.js

[Formula.js](http://formulajs.info/) cung cấp một lượng lớn các hàm tương thích Excel.

## Tham khảo hàm

### Ngày tháng

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | tạo ngày từ năm, tháng và ngày đã cho. | `DATE(2008, 7, 8)` | năm (số nguyên), tháng (1-12), ngày (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | chuyển đổi ngày định dạng văn bản thành số sê-ri ngày. | `DATEVALUE('8/22/2011')` | chuỗi văn bản biểu thị ngày | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | trả về phần ngày của ngày chỉ định. | `DAY('15-Apr-11')` | giá trị ngày hoặc chuỗi văn bản ngày. | 15 |
| **DAYS** | tính số ngày giữa hai ngày. | `DAYS('3/15/11', '2/1/11')` | ngày kết thúc, ngày bắt đầu. | 42 |
| **DAYS360** | tính số ngày giữa hai ngày dựa trên một năm 360 ngày. | `DAYS360('1-Jan-11', '31-Dec-11')` | ngày bắt đầu, ngày kết thúc. | 360 |
| **EDATE** | trả về ngày trước hoặc sau số tháng chỉ định. | `EDATE('1/15/11', -1)` | ngày bắt đầu, số tháng (số dương là tương lai, số âm là quá khứ). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | trả về ngày cuối tháng trước hoặc sau số tháng chỉ định. | `EOMONTH('1/1/11', -3)` | ngày bắt đầu, số tháng (số dương là tương lai, số âm là quá khứ). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | trả về phần giờ của thời gian. | `HOUR('7/18/2011 7:45:00 AM')` | giá trị thời gian hoặc chuỗi văn bản thời gian. | 7 |
| **MINUTE** | trả về phần phút của thời gian. | `MINUTE('2/1/2011 12:45:00 PM')` | giá trị thời gian hoặc chuỗi văn bản thời gian. | 45 |
| **ISOWEEKNUM** | trả về số tuần ISO của ngày đã cho trong năm. | `ISOWEEKNUM('3/9/2012')` | giá trị ngày hoặc chuỗi văn bản ngày. | 10 |
| **MONTH** | trả về phần tháng của ngày chỉ định. | `MONTH('15-Apr-11')` | giá trị ngày hoặc chuỗi văn bản ngày. | 4 |
| **NETWORKDAYS** | tính số ngày làm việc giữa hai ngày, không bao gồm cuối tuần và các ngày nghỉ chỉ định. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | ngày bắt đầu, ngày kết thúc, mảng ngày nghỉ tùy chọn. | 109 |
| **NETWORKDAYSINTL** | tính số ngày làm việc giữa hai ngày, cho phép tùy chỉnh cuối tuần và loại trừ các ngày nghỉ chỉ định. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | ngày bắt đầu, ngày kết thúc, chế độ cuối tuần, mảng ngày nghỉ tùy chọn. | 23 |
| **NOW** | trả về ngày và giờ hiện tại. | `NOW()` | không có tham số. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | trả về phần giây của thời gian. | `SECOND('2/1/2011 4:48:18 PM')` | giá trị thời gian hoặc chuỗi văn bản thời gian. | 18 |
| **TIME** | tạo thời gian từ giờ, phút và giây đã cho. | `TIME(16, 48, 10)` | giờ (0-23), phút (0-59), giây (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | chuyển đổi thời gian định dạng văn bản thành số sê-ri thời gian. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | chuỗi văn bản biểu thị thời gian. | 0.2743055555555556 |
| **TODAY** | trả về ngày hôm nay. | `TODAY()` | không có tham số. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | trả về số ngày trong tuần. | `WEEKDAY('2/14/2008', 3)` | giá trị ngày hoặc chuỗi văn bản ngày, kiểu trả về(1-3). | 3 |
| **YEAR** | trả về phần năm của ngày chỉ định. | `YEAR('7/5/2008')` | giá trị ngày hoặc chuỗi văn bản ngày. | 2008 |
| **WEEKNUM** | trả về số tuần của ngày đã cho trong năm. | `WEEKNUM('3/9/2012', 2)` | giá trị ngày hoặc chuỗi văn bản ngày, ngày bắt đầu tuần tùy chọn(1=Chủ nhật, 2=Thứ Hai). | 11 |
| **WORKDAY** | trả về ngày trước hoặc sau số ngày làm việc chỉ định kể từ ngày bắt đầu, không bao gồm cuối tuần và các ngày nghỉ chỉ định. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | ngày bắt đầu, số ngày làm việc, mảng ngày nghỉ tùy chọn. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | trả về ngày trước hoặc sau số ngày làm việc chỉ định kể từ ngày bắt đầu, cho phép tùy chỉnh cuối tuần và loại trừ các ngày nghỉ chỉ định. | `WORKDAYINTL('1/1/2012', 30, 17)` | ngày bắt đầu, số ngày làm việc, chế độ cuối tuần. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | tính phân số năm giữa hai ngày. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | ngày bắt đầu, ngày kết thúc, cơ sở tùy chọn(chuẩn đếm ngày). | 0.5780821917808219 |

### Tài chính

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | tính lãi tích lũy của chứng khoán thanh toán lãi định kỳ. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | ngày bắt đầu, ngày thanh toán lãi đầu tiên, ngày thanh toán, lãi suất hàng năm, mệnh giá, số kỳ, cơ sở. | 350 |
| **CUMIPMT** | tính các thanh toán lãi tích lũy trong một loạt các thanh toán. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | lãi suất, tổng số kỳ, giá trị hiện tại, kỳ bắt đầu, kỳ kết thúc, loại thanh toán(0=cuối kỳ, 1=đầu kỳ). | -9916.77251395708 |
| **CUMPRINC** | tính các thanh toán gốc tích lũy trong một loạt các thanh toán. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | lãi suất, tổng số kỳ, giá trị hiện tại, kỳ bắt đầu, kỳ kết thúc, loại thanh toán(0=cuối kỳ, 1=đầu kỳ). | -614.0863271085149 |
| **DB** | tính khấu hao sử dụng phương pháp số dư giảm dần cố định. | `DB(1000000, 100000, 6, 1, 6)` | chi phí, giá trị còn lại, tuổi thọ, kỳ, tháng. | 159500 |
| **DDB** | tính khấu hao sử dụng phương pháp số dư giảm dần kép hoặc phương pháp chỉ định khác. | `DDB(1000000, 100000, 6, 1, 1.5)` | chi phí, giá trị còn lại, tuổi thọ, kỳ, hệ số. | 250000 |
| **DOLLARDE** | chuyển đổi giá biểu diễn dạng phân số thành dạng thập phân. | `DOLLARDE(1.1, 16)` | giá đô la dạng phân số, mẫu số. | 1.625 |
| **DOLLARFR** | chuyển đổi giá biểu diễn dạng thập phân thành dạng phân số. | `DOLLARFR(1.625, 16)` | giá đô la dạng thập phân, mẫu số. | 1.1 |
| **EFFECT** | tính lãi suất hàng năm thực tế. | `EFFECT(0.1, 4)` | lãi suất hàng năm danh nghĩa, số lần ghép lãi mỗi năm. | 0.10381289062499977 |
| **FV** | tính đầu tư giá trị tương lai. | `FV(0.1/12, 10, -100, -1000, 0)` | lãi suất mỗi kỳ, số kỳ, số tiền thanh toán mỗi kỳ, giá trị hiện tại, loại thanh toán(0=cuối kỳ, 1=đầu kỳ). | 2124.874409194097 |
| **FVSCHEDULE** | dựa trênmột loạt tỷ lệ ghép lãitính số gốc giá trị tương lai. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | số gốc, mảng lãi suất. | 133.08900000000003 |
| **IPMT** | tính trong kỳ cụ thể thanh toán lãi. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | lãi suất mỗi kỳ, kỳ, tổng số kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán(0=cuối kỳ, 1=đầu kỳ). | 928.8235718400465 |
| **IRR** | tínhtỷ lệ hoàn vốn nội bộ. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | mảng dòng tiền, giá trị ước tính. | 0.05715142887178447 |
| **ISPMT** | tính trong kỳ cụ thể thanh toán lãi(áp dụng cho khoản vay). | `ISPMT(0.1/12, 6, 2*12, 100000)` | lãi suất mỗi kỳ, kỳ, tổng số kỳ, số tiền vay. | -625 |
| **MIRR** | tính tỷ lệ hoàn vốn nội bộ đã hiệu chỉnh. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | mảng dòng tiền, lãi suất tài trợ, lãi suất tái đầu tư. | 0.07971710360838036 |
| **NOMINAL** | tính lãi suất hàng năm danh nghĩa. | `NOMINAL(0.1, 4)` | lãi suất hàng năm thực tế, số lần ghép lãi mỗi năm. | 0.09645475633778045 |
| **NPER** | tính số kỳ cần thiết để đạt đến giá trị mục tiêu. | `NPER(0.1/12, -100, -1000, 10000, 0)` | lãi suất mỗi kỳ, số tiền thanh toán mỗi kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán(0=cuối kỳ, 1=đầu kỳ). | 63.39385422740764 |
| **NPV** | tính một loạt dòng tiền tương lai cho giá trị hiện tại ròng. | `NPV(0.1, -10000, 2000, 4000, 8000)` | tỷ lệ chiết khấu mỗi kỳ, mảng dòng tiền. | 1031.3503176012546 |
| **PDURATION** | tínhđạt đến giá trị cụ thểcần thiết thời gian. | `PDURATION(0.1, 1000, 2000)` | lãi suất mỗi kỳ, giá trị hiện tại, giá trị tương lai. | 7.272540897341714 |
| **PMT** | tính khoản vay số tiền thanh toán mỗi kỳ. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | lãi suất mỗi kỳ, tổng số kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán(0=cuối kỳ, 1=đầu kỳ). | -42426.08563793503 |
| **PPMT** | tính trong kỳ cụ thể số gốcthanh toán. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | lãi suất mỗi kỳ, kỳ, tổng số kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán(0=cuối kỳ, 1=đầu kỳ). | -43354.909209775076 |
| **PV** | tính đầu tư giá trị hiện tại. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | lãi suất mỗi kỳ, số kỳ, số tiền thanh toán mỗi kỳ, giá trị tương lai, loại thanh toán(0=cuối kỳ, 1=đầu kỳ). | -29864.950264779152 |
| **RATE** | tínhlãi suất mỗi kỳ. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | tổng số kỳ, số tiền thanh toán mỗi kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán(0=cuối kỳ, 1=đầu kỳ), giá trị ước tính. | 0.06517891177181533 |

### Kỹ thuật

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | chuyển đổi số nhị phân thành số thập phân. | `BIN2DEC(101010)` | nhị phângiá trị số. | 42 |
| **BIN2HEX** | chuyển đổi số nhị phân thành số thập lục phân. | `BIN2HEX(101010)` | nhị phângiá trị số. | 2a |
| **BIN2OCT** | chuyển đổi số nhị phân thành số bát phân. | `BIN2OCT(101010)` | nhị phângiá trị số. | 52 |
| **BITAND** | thực hiện hai số phép AND theo bit. | `BITAND(42, 24)` | số nguyên, số nguyên. | 8 |
| **BITLSHIFT** | thực hiện thao tác dịch trái cho số. | `BITLSHIFT(42, 24)` | số nguyên, lượng dịch. | 704643072 |
| **BITOR** | thực hiện hai số phép OR theo bit. | `BITOR(42, 24)` | số nguyên, số nguyên. | 58 |
| **BITRSHIFT** | thực hiện thao tác dịch phải cho số. | `BITRSHIFT(42, 2)` | số nguyên, lượng dịch. | 10 |
| **BITXOR** | thực hiện hai số phép XOR theo bit. | `BITXOR(42, 24)` | số nguyên, số nguyên. | 50 |
| **COMPLEX** | tạo số phức. | `COMPLEX(3, 4)` | phần thực, phần ảo. | 3+4i |
| **CONVERT** | chuyển đổi giá trị số giữa các đơn vị khác nhau. | `CONVERT(64, 'kibyte', 'bit')` | giá trị số, đơn vị ban đầu, đơn vị đích. | 524288 |
| **DEC2BIN** | chuyển đổi số thập phân thành số nhị phân. | `DEC2BIN(42)` | thập phângiá trị số. | 101010 |
| **DEC2HEX** | chuyển đổi số thập phân thành số thập lục phân. | `DEC2HEX(42)` | thập phângiá trị số. | 2a |
| **DEC2OCT** | chuyển đổi số thập phân thành số bát phân. | `DEC2OCT(42)` | thập phângiá trị số. | 52 |
| **DELTA** | kiểm tra hai giá trị có bằng nhau hay không. | `DELTA(42, 42)` | giá trị số, giá trị số. | 1 |
| **ERF** | tính sai sốhàm. | `ERF(1)` | cận trên. | 0.8427007929497149 |
| **ERFC** | tính bùhàm sai số. | `ERFC(1)` | cận dưới. | 0.1572992070502851 |
| **GESTEP** | kiểm tra một số có lớn hơn hoặc bằng số khác hay không. | `GESTEP(42, 24)` | giá trị số, ngưỡng. | 1 |
| **HEX2BIN** | chuyển đổi số thập lục phân thành số nhị phân. | `HEX2BIN('2a')` | thập lục phângiá trị số. | 101010 |
| **HEX2DEC** | chuyển đổi số thập lục phân thành số thập phân. | `HEX2DEC('2a')` | thập lục phângiá trị số. | 42 |
| **HEX2OCT** | chuyển đổi số thập lục phân thành số bát phân. | `HEX2OCT('2a')` | thập lục phângiá trị số. | 52 |
| **IMABS** | tính giá trị tuyệt đối của số phức(modulus). | `IMABS('3+4i')` | số phức. | 5 |
| **IMAGINARY** | trả vềsố phức phần ảo. | `IMAGINARY('3+4i')` | số phức. | 4 |
| **IMARGUMENT** | tính góc pha của số phức. | `IMARGUMENT('3+4i')` | số phức. | 0.9272952180016122 |
| **IMCONJUGATE** | tính liên hợp của số phức. | `IMCONJUGATE('3+4i')` | số phức. | 3-4i |
| **IMCOS** | tính cos của số phức. | `IMCOS('1+i')` | số phức. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | tính cos hyperbolic của số phức. | `IMCOSH('1+i')` | số phức. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | tính cot của số phức. | `IMCOT('1+i')` | số phức. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | tính csc của số phức. | `IMCSC('1+i')` | số phức. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | tính csc hyperbolic của số phức. | `IMCSCH('1+i')` | số phức. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | tínhhai phép chia số phức. | `IMDIV('1+2i', '3+4i')` | số bị chia (số phức), số chia (số phức). | 0.44+0.08i |
| **IMEXP** | tính số mũ của số phức. | `IMEXP('1+i')` | số phức. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | tính logarit ký tự nhiên của số phức. | `IMLN('1+i')` | số phức. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | tính logarit cơ số 10 của số phức. | `IMLOG10('1+i')` | số phức. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | tính logarit cơ số 2 của số phức. | `IMLOG2('1+i')` | số phức. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | tính lũy thừa số phức. | `IMPOWER('1+i', 2)` | số phức, số mũ. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Tính tích của nhiều số phức. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | mảng số phức. | -85+20i |
| **IMREAL** | trả vềsố phức phần thực. | `IMREAL('3+4i')` | số phức. | 3 |
| **IMSEC** | tính sec của số phức. | `IMSEC('1+i')` | số phức. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | tính sec hyperbolic của số phức. | `IMSECH('1+i')` | số phức. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | tính sin của số phức. | `IMSIN('1+i')` | số phức. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | tính sin hyperbolic của số phức. | `IMSINH('1+i')` | số phức. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | tính số phứccăn bậc hai. | `IMSQRT('1+i')` | số phức. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Tính phép trừ của hai số phức. | `IMSUB('3+4i', '1+2i')` | số bị trừ (số phức), số trừ (số phức). | 2+2i |
| **IMSUM** | tínhnhiều số phức  và . | `IMSUM('1+2i', '3+4i', '5+6i')` | mảng số phức. | 9+12i |
| **IMTAN** | tính tan của số phức. | `IMTAN('1+i')` | số phức. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | chuyển đổi số bát phân thành số nhị phân. | `OCT2BIN('52')` | bát phângiá trị số. | 101010 |
| **OCT2DEC** | chuyển đổi số bát phân thành số thập phân. | `OCT2DEC('52')` | bát phângiá trị số. | 42 |
| **OCT2HEX** | chuyển đổi số bát phân thành số thập lục phân. | `OCT2HEX('52')` | bát phângiá trị số. | 2a |

### Logic

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Trả về true khi tất cả tham số đều là true, ngược lại trả về false. | `AND(true, false, true)` | tham số là một hoặc nhiều giá trị logic (giá trị boolean), Hàm chỉ trả về true khi tất cả các tham số đều là true. | |
| **FALSE** | trả vềgiá trị logicfalse. | `FALSE()` | không có tham số. | |
| **IF** | dựa trên điều kiện true/falsetrả vềkhác nhau giá trị. | `IF(true, 'Hello!', 'Goodbye!')` | điều kiện, điều kiện là true giá trị, điều kiện là falsekhi giá trị. | Hello! |
| **IFS** | kiểm tranhiềuđiều kiện, và trả về kết quả đầu tiên là true. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Nhiều cặp điều kiện và tương ứng giá trị, theo cặp xuất hiện. | Goodbye! |
| **NOT** | đảogiá trị logic, truethànhfalse, falsethànhtrue. | `NOT(true)` | một giá trị logic (giá trị boolean). | |
| **OR** | Trả về true khi có bất kỳ tham số nào là true, ngược lại trả về false. | `OR(true, false, true)` | tham số là một hoặc nhiều giá trị logic (giá trị boolean), Hàm sẽ trả về true nếu có bất kỳ tham số nào là true. | |
| **SWITCH** | dựa trêngiá trị biểu thứctrả vềgiá trị kết quả khớp, nếu không cókhớpthì trả vềgiá trị mặc định. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | biểu thức, giá trị khớp1, kết quảgiá trị1, ..., [giá trị mặc định]. | Seven |
| **TRUE** | trả vềgiá trị logictrue. | `TRUE()` | không có tham số. | |
| **XOR** | Trả về true khi và chỉ khi có số lẻ tham số là true, ngược lại trả về false. | `XOR(true, false, true)` | tham số là một hoặc nhiều giá trị logic (giá trị boolean), Trả về true khi có số lẻ tham số là true. | |

### Toán học

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | trả vềgiá trị số giá trị tuyệt đối. | `ABS(-4)` | giá trị số. | 4 |
| **ACOS** | tính nghịch đảocos (radian). | `ACOS(-0.5)` | giá trị số giữa -1 và 1. | 2.0943951023931957 |
| **ACOSH** | tínhnghịch đảocos hyperbolic. | `ACOSH(10)` | giá trị số lớn hơn hoặc bằng 1. | 2.993222846126381 |
| **ACOT** | tính nghịch đảotan (radian). | `ACOT(2)` | giá trị số bất kỳ. | 0.46364760900080615 |
| **ACOTH** | tínhnghịch đảotan hyperbolic. | `ACOTH(6)` | giá trị số có giá trị tuyệt đối lớn hơn 1. | 0.16823611831060645 |
| **AGGREGATE** | Thực hiện phép tính tổng hợp, bỏ qua lỗi hoặc các hàng ẩn. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | số hàm, tùy chọn, mảng1, ..., mảngN. | 10,32 |
| **ARABIC** | Chuyển đổi số La Mã thành số Ả Rập. | `ARABIC('MCMXII')` | số La Mãchuỗi. | 1912 |
| **ASIN** | tính nghịch đảosin (radian). | `ASIN(-0.5)` | giá trị số giữa -1 và 1. | -0.5235987755982988 |
| **ASINH** | tínhnghịch đảosin hyperbolic. | `ASINH(-2.5)` | giá trị số bất kỳ. | -1.6472311463710965 |
| **ATAN** | tính nghịch đảotan (radian). | `ATAN(1)` | giá trị số bất kỳ. | 0.7853981633974483 |
| **ATAN2** | dựa trêntọa độtính nghịch đảotan (radian). | `ATAN2(-1, -1)` | ytọa độ, xtọa độ. | -2.356194490192345 |
| **ATANH** | tínhnghịch đảotan hyperbolic. | `ATANH(-0.1)` | giá trị số giữa -1 và 1. | -0.10033534773107562 |
| **BASE** | Chuyển đổi giá trị số thành biểu diễn văn bản với cơ số chỉ định. | `BASE(15, 2, 10)` | giá trị số, cơ số, [độ dài tối thiểu]. | 0000001111 |
| **CEILING** | Làm tròn giá trị số lên đến bội số gần nhất. | `CEILING(-5.5, 2, -1)` | giá trị số, bội số, [kiểu modulus]. | -6 |
| **CEILINGMATH** | Làm tròn giá trị số lên, sử dụngchỉ định bội số và hướng. | `CEILINGMATH(-5.5, 2, -1)` | giá trị số, [bội số], [kiểu modulus]. | -6 |
| **CEILINGPRECISE** | Làm tròn giá trị số lên đến bội số gần nhất, không xem xét dấu. | `CEILINGPRECISE(-4.1, -2)` | giá trị số, [bội số]. | -4 |
| **COMBIN** | Tính số tổ hợp. | `COMBIN(8, 2)` | tổng số, số được chọn. | 28 |
| **COMBINA** | tínhcho phép lặp số tổ hợp. | `COMBINA(4, 3)` | tổng số, số được chọn. | 20 |
| **COS** | tínhgiá trị cos(radian). | `COS(1)` | góc (radian). | 0.5403023058681398 |
| **COSH** | tínhhyperbolicgiá trị cos. | `COSH(1)` | giá trị số bất kỳ. | 1.5430806348152437 |
| **COT** | tínhgiá trị cot(radian). | `COT(30)` | góc (radian). | -0.15611995216165922 |
| **COTH** | tínhhyperbolicgiá trị cot. | `COTH(2)` | giá trị số bất kỳ. | 1.0373147207275482 |
| **CSC** | tínhgiá trị csc(radian). | `CSC(15)` | góc (radian). | 1.5377805615408537 |
| **CSCH** | tínhhyperbolicgiá trị csc. | `CSCH(1.5)` | giá trị số bất kỳ. | 0.46964244059522464 |
| **DECIMAL** | số dạng chuyển đổi văn bản thành thập phân. | `DECIMAL('FF', 16)` | văn bản, cơ số. | 255 |
| **ERF** | tính sai sốhàm. | `ERF(1)` | cận trên. | 0.8427007929497149 |
| **ERFC** | tính bùhàm sai số. | `ERFC(1)` | cận dưới. | 0.1572992070502851 |
| **EVEN** | Làm tròn giá trị số lên đến số chẵn gần nhất. | `EVEN(-1)` | giá trị số. | -2 |
| **EXP** | Tính e mũ x. | `EXP(1)` | số mũ. | 2.718281828459045 |
| **FACT** | Tính giai thừa. | `FACT(5)` | số nguyên không âm. | 120 |
| **FACTDOUBLE** | tínhképgiai thừa. | `FACTDOUBLE(7)` | số nguyên không âm. | 105 |
| **FLOOR** | Làm tròn giá trị số xuống đến gần nhất bội số. | `FLOOR(-3.1)` | giá trị số, bội số. | -4 |
| **FLOORMATH** | Làm tròn giá trị số xuống, sử dụngchỉ định bội số và hướng. | `FLOORMATH(-4.1, -2, -1)` | giá trị số, [bội số], [kiểu modulus]. | -4 |
| **FLOORPRECISE** | Làm tròn giá trị số xuống đến gần nhất bội số, không xem xét dấu. | `FLOORPRECISE(-3.1, -2)` | giá trị số, [bội số]. | -4 |
| **GCD** | Tính ước chung lớn nhất. | `GCD(24, 36, 48)` | hai hoặc nhiều số nguyên. | 12 |
| **INT** | Làm tròn giá trị số xuống thành số nguyên gần nhất. | `INT(-8.9)` | giá trị số. | -9 |
| **ISEVEN** | kiểm tragiá trị sốcó phải là số chẵn. | `ISEVEN(-2.5)` | giá trị số. | |
| **ISOCEILING** | Làm tròn giá trị số lên đến bội số gần nhất, tuân theo chuẩn ISO. | `ISOCEILING(-4.1, -2)` | giá trị số, [bội số]. | -4 |
| **ISODD** | kiểm tragiá trị sốcó phải là số lẻ. | `ISODD(-2.5)` | giá trị số. | |
| **LCM** | Tính bội chung nhỏ nhất. | `LCM(24, 36, 48)` | hai hoặc nhiều số nguyên. | 144 |
| **LN** | Tính logarit ký tự nhiên. | `LN(86)` | giá trị dương. | 4.454347296253507 |
| **LOG** | Tính logarit cơ số chỉ định. | `LOG(8, 2)` | giá trị số, cơ số. | 3 |
| **LOG10** | tínhlogarit cơ số 10. | `LOG10(100000)` | giá trị dương. | 5 |
| **MOD** | Tính số dư của phép chia hai số. | `MOD(3, -2)` | số bị chia, số chia. | -1 |
| **MROUND** | Làm tròn giá trị số đến bội số gần nhất. | `MROUND(-10, -3)` | giá trị số, bội số. | -9 |
| **MULTINOMIAL** | Tính hệ số đa thức. | `MULTINOMIAL(2, 3, 4)` | hai hoặc nhiều số nguyên không âm. | 1260 |
| **ODD** | Làm tròn giá trị số lên đến gần nhất số lẻ. | `ODD(-1.5)` | giá trị số. | -3 |
| **POWER** | tínhsố mũ. | `POWER(5, 2)` | cơ số, số mũ. | 25 |
| **PRODUCT** | tínhnhiềugiá trị số tích. | `PRODUCT(5, 15, 30)` | một hoặc nhiềugiá trị số. | 2250 |
| **QUOTIENT** | tínhphép chia hai số thương, không bao gồmsố dư. | `QUOTIENT(-10, 3)` | số bị chia, số chia. | -3 |
| **RADIANS** | gócchuyển đổi thành radian. | `RADIANS(180)` | góc. | 3.141592653589793 |
| **RAND** | Sinh số thực ngẫu nhiên giữa 0 và 1. | `RAND()` | không có tham số. | [Random real number between 0 and 1] |
| **RANDBETWEEN** | Sinhtrong phạm vi chỉ định số nguyên ngẫu nhiên. | `RANDBETWEEN(-1, 1)` | cận dưới, cận trên. | [Random integer between bottom and top] |
| **ROUND** | theo chỉ địnhsố chữ sốlàm tròngiá trị số. | `ROUND(626.3, -3)` | giá trị số, số chữ số. | 1000 |
| **ROUNDDOWN** | Làm tròn giá trị số xuống đến chỉ địnhsố chữ số. | `ROUNDDOWN(-3.14159, 2)` | giá trị số, số chữ số. | -3.14 |
| **ROUNDUP** | Làm tròn giá trị số lên đến chỉ địnhsố chữ số. | `ROUNDUP(-3.14159, 2)` | giá trị số, số chữ số. | -3.15 |
| **SEC** | tínhgiá trị sec(radian). | `SEC(45)` | góc (radian). | 1.9035944074044246 |
| **SECH** | tínhhyperbolicgiá trị sec. | `SECH(45)` | giá trị số bất kỳ. | 5.725037161098787e-20 |
| **SIGN** | trả vềgiá trị số ký tự hiệu. | `SIGN(-0.00001)` | giá trị số. | -1 |
| **SIN** | tínhgiá trị sin(radian). | `SIN(1)` | góc (radian). | 0.8414709848078965 |
| **SINH** | tínhhyperbolicgiá trị sin. | `SINH(1)` | giá trị số bất kỳ. | 1.1752011936438014 |
| **SQRT** | tínhcăn bậc hai. | `SQRT(16)` | không âmgiá trị số. | 4 |
| **SQRTPI** | tínhgiá trị số với π tíchcăn bậc hai. | `SQRTPI(2)` | không âmgiá trị số. | 2.5066282746310002 |
| **SUBTOTAL** | Tính giá trị tóm tắt của tập con, bỏ qua các hàng ẩn. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | số hàm, mảng1, ..., mảngN. | 10,32 |
| **SUM** | tínhtổng các giá trị số , bỏ qua văn bản. | `SUM(-5, 15, 32, 'Hello World!')` | một hoặc nhiềugiá trị số. | 42 |
| **SUMIF** | Tính tổng dựa trên điều kiện . | `SUMIF([2,4,8,16], '>5')` | mảng, điều kiện. | 24 |
| **SUMIFS** | Tính tổng dựa trên nhiều điều kiện . | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | tổng mảng, mảng điều kiện1, điều kiện1, ..., mảng điều kiệnN, điều kiệnN. | 12 |
| **SUMPRODUCT** | Tính tổng tích các phần tử của mảng . | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | hai hoặc nhiềumảng. | 5 |
| **SUMSQ** | tínhgiá trị số tổng bình phương . | `SUMSQ(3, 4)` | một hoặc nhiềugiá trị số. | 25 |
| **SUMX2MY2** | tínhhai mảng phần tử tương ứngbình phương hiệutổng . | `SUMX2MY2([1,2], [3,4])` | mảng1, mảng2. | -20 |
| **SUMX2PY2** | tínhhai mảng phần tử tương ứngtổng bình phương tổng . | `SUMX2PY2([1,2], [3,4])` | mảng1, mảng2. | 30 |
| **SUMXMY2** | Tính tổng bình phương của hiệu các phần tử tương ứng của hai mảng . | `SUMXMY2([1,2], [3,4])` | mảng1, mảng2. | 8 |
| **TAN** | tínhgiá trị tan(radian). | `TAN(1)` | góc (radian). | 1.5574077246549023 |
| **TANH** | tínhhyperbolicgiá trị tan. | `TANH(-2)` | giá trị số bất kỳ. | -0.9640275800758168 |
| **TRUNC** | Cắt bỏ giá trị số, không thực hiện làm tròn. | `TRUNC(-8.9)` | giá trị số, [số chữ số]. | -8 |

### Thống kê

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Tính sai lệch trung bình tuyệt đối. | `AVEDEV([2,4], [8,16])` | tham số là mảng giá trị số, biểu thị các điểm dữ liệu. | 4.5 |
| **AVERAGE** | tínhsố họcgiá trị trung bình. | `AVERAGE([2,4], [8,16])` | tham số là mảng giá trị số, biểu thịcầntrung bình điểm dữ liệu. | 7.5 |
| **AVERAGEA** | tínhbao gồm cả văn bản và giá trị logic giá trị trung bình. | `AVERAGEA([2,4], [8,16])` | tham số là mảng giá trị số, văn bản hoặc giá trị logic, tất cả các giá trị không rỗng đều được tính. | 7.5 |
| **AVERAGEIF** | Tính giá trị trung bình dựa trên một điều kiện. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | đầu tiêntham số là mảng giá trị số, tham số thứ hai là điều kiện, tham số thứ ba làtùy chọn mảng giá trị sốdùng chotrung bình. | 3.5 |
| **AVERAGEIFS** | Tính giá trị trung bình dựa trên nhiều điều kiện. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | đầu tiêntham số là mảng giá trị số, theo sau làtheo cặp  mảng điều kiện và biểu thức điều kiện. | 6 |
| **BETADIST** | Tính hàm mật độ xác suất Beta tích lũy. | `BETADIST(2, 8, 10, true, 1, 3)` | tham số lần lượt là giá trị, α, β, cờ tích lũy, A(tùy chọn) và B(tùy chọn). | 0.6854705810117458 |
| **BETAINV** | Tính hàm mật độ xác suất Beta tích lũy hàm nghịch đảo. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | tham số lần lượt là xác suất, α, β, A(tùy chọn) và B(tùy chọn). | 1.9999999999999998 |
| **BINOMDIST** | Tính xác suất phân phối nhị thức. | `BINOMDIST(6, 10, 0.5, false)` | tham số lần lượt là số lần thử, số lần thành công, thành côngxác suất, cờ tích lũy. | 0.205078125 |
| **CORREL** | tínhhai tập dữ liệu hệ số tương quan. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | tham số làhai mảng giá trị số, biểu thị hai tập dữ liệu. | 0.9970544855015815 |
| **COUNT** | Đếm số ô có giá trị số. | `COUNT([1,2], [3,4])` | tham số là mảng giá trị số hoặc phạm vi. | 4 |
| **COUNTA** | tínhkhông rỗngô số lượng. | `COUNTA([1, null, 3, 'a', '', 'c'])` | tham số là mảng hoặc phạm vi kiểu bất kỳ. | 4 |
| **COUNTBLANK** | tínhô trống số lượng. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | tham số là mảng hoặc phạm vi kiểu bất kỳ. | 2 |
| **COUNTIF** | Đếm số ô dựa trên điều kiện. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | tham số là mảng giá trị số hoặc văn bản và điều kiện. | 3 |
| **COUNTIFS** | Đếm số ô dựa trên nhiều điều kiện. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | tham số là các cặp  mảng điều kiện và biểu thức điều kiện. | 2 |
| **COVARIANCEP** | Tính hiệp phương sai tổng thể. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | tham số làhai mảng giá trị số, biểu thị hai tập dữ liệu. | 5.2 |
| **COVARIANCES** | tínhmẫuhiệp phương sai. | `COVARIANCES([2,4,8], [5,11,12])` | tham số làhai mảng giá trị số, biểu thị hai tập dữ liệu. | 9.666666666666668 |
| **DEVSQ** | tínhsai lệchtổng bình phương . | `DEVSQ([2,4,8,16])` | tham số là mảng giá trị số, biểu thị các điểm dữ liệu. | 115 |
| **EXPONDIST** | tínhsố mũphân phối. | `EXPONDIST(0.2, 10, true)` | tham số lần lượt là giá trị, λ, cờ tích lũy. | 0.8646647167633873 |
| **FDIST** | tínhFxác suấtphân phối. | `FDIST(15.2069, 6, 4, false)` | tham số lần lượt là giá trị, bậc ký tự do1, bậc ký tự do2, cờ tích lũy. | 0.0012237917087831735 |
| **FINV** | tínhFxác suấtphân phối hàm nghịch đảo. | `FINV(0.01, 6, 4)` | tham số lần lượt là xác suất, bậc ký tự do1, bậc ký tự do2. | 0.10930991412457851 |
| **FISHER** | Tính biến đổi Fisher. | `FISHER(0.75)` | tham số là một giá trị số, biểu thịhệ số tương quan. | 0.9729550745276566 |
| **FISHERINV** | Tính biến đổi Fisher ngược. | `FISHERINV(0.9729550745276566)` | tham số là một giá trị số, biểu thịbiến đổi Fisher kết quả. | 0.75 |
| **FORECAST** | Dự đoán giá trị y của x mới dựa trên giá trị x và y đã biết. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | tham số lần lượt làx mớigiá trị, đã biếtgiá trị ymảng, đã biếtgiá trị xmảng. | 10.607253086419755 |
| **FREQUENCY** | Tính phân phối tần suất. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | tham số lần lượt làmảng dữ liệu, mảng biên giới phân loại. | 1,2,4,2 |
| **GAMMA** | Tính giá trị hàm Gamma. | `GAMMA(2.5)` | tham số là mộtsố dương. | 1.3293403919101043 |
| **GAMMALN** | Tính logarit ký tự nhiên của hàm Gamma. | `GAMMALN(10)` | tham số là mộtsố dương. | 12.801827480081961 |
| **GAUSS** | Tính xác suất dưới của phân phối chuẩn tắc. | `GAUSS(2)` | tham số là một giá trị số, biểu thịđiểm z. | 0.4772498680518208 |
| **GEOMEAN** | tínhhình họcgiá trị trung bình. | `GEOMEAN([2,4], [8,16])` | tham số là mảng giá trị số, biểu thị các điểm dữ liệu. | 5.656854249492381 |
| **GROWTH** | dựa trênđã biếtdữ liệudự đoánsố mũtăng trưởnggiá trị. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | tham số lần lượt làđã biếtgiá trị ymảng, đã biếtgiá trị xmảng, x mớimảng giá trị. | 32.00000000000003 |
| **HARMEAN** | Tính giá trị trung bình điều hòa. | `HARMEAN([2,4], [8,16])` | tham số là mảng giá trị số, biểu thị các điểm dữ liệu. | 4.266666666666667 |
| **HYPGEOMDIST** | Tính phân phối siêu hình học. | `HYPGEOMDIST(1, 4, 8, 20, false)` | tham số lần lượt làsố lần thành công trong mẫu, cỡ mẫu , tổng thể trong thành công số lần, tổng thể lớn  nhỏ , cờ tích lũy. | 0.3632610939112487 |
| **INTERCEPT** | Tính giao điểm của hồi quy tuyến tính. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | tham số lần lượt làđã biếtgiá trị ymảng, đã biếtgiá trị xmảng. | 0.04838709677419217 |
| **KURT** | Tính độ nhọn. | `KURT([3,4,5,2,3,4,5,6,4,7])` | tham số là mảng giá trị số, biểu thị các điểm dữ liệu. | -0.15179963720841627 |
| **LARGE** | trả vềgiá trị lớn thứ k. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | tham số lần lượt làmảng giá trị số, giá trị k. | 5 |
| **LINEST** | thực hiệntuyến tínhhồi quyphân tích. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | tham số lần lượt làđã biếtgiá trị ymảng, đã biếtgiá trị xmảng, có trả về thông tin thống kê bổ sung không, có trả về thêm thông tin thống kê không. | 2,1 |
| **LOGNORMDIST** | tínhlogaritphân phối chuẩn tắc. | `LOGNORMDIST(4, 3.5, 1.2, true)` | tham số lần lượt là giá trị, giá trị trung bình, độ lệch chuẩn, cờ tích lũy. | 0.0390835557068005 |
| **LOGNORMINV** | tínhlogaritphân phối chuẩn tắc hàm nghịch đảo. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | tham số lần lượt là xác suất, giá trị trung bình, độ lệch chuẩn, cờ tích lũy. | 4.000000000000001 |
| **MAX** | trả vềgiá trị lớn nhất. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | tham số là mảng giá trị số. | 0.8 |
| **MAXA** | trả vềbao gồmvăn bản và giá trị logic giá trị lớn nhất. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | tham số là mảng giá trị số, văn bản hoặc giá trị logic. | 1 |
| **MEDIAN** | trả về trong số chữ số. | `MEDIAN([1,2,3], [4,5,6])` | tham số là mảng giá trị số. | 3.5 |
| **MIN** | trả vềgiá trị nhỏ nhất. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | tham số là mảng giá trị số. | 0.1 |
| **MINA** | trả vềbao gồmvăn bản và giá trị logic giá trị nhỏ nhất. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | tham số là mảng giá trị số, văn bản hoặc giá trị logic. | 0 |
| **MODEMULT** | trả vềxuất hiệntần suấtcao nhất mảng giá trị. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | tham số là mảng giá trị số. | 2,3 |
| **MODESNGL** | trả vềphổ biến nhấtgiá trị xuất hiện. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | tham số là mảng giá trị số. | 2 |
| **NORMDIST** | tínhphân phối chuẩn tắc. | `NORMDIST(42, 40, 1.5, true)` | tham số lần lượt là giá trị, giá trị trung bình, độ lệch chuẩn, cờ tích lũy. | 0.9087887802741321 |
| **NORMINV** | tínhphân phối chuẩn tắc hàm nghịch đảo. | `NORMINV(0.9087887802741321, 40, 1.5)` | tham số lần lượt là xác suất, giá trị trung bình, độ lệch chuẩn. | 42 |
| **NORMSDIST** | tínhphân phối chuẩn tắc. | `NORMSDIST(1, true)` | tham số là một giá trị số, biểu thịđiểm z. | 0.8413447460685429 |
| **NORMSINV** | tínhphân phối chuẩn tắc hàm nghịch đảo. | `NORMSINV(0.8413447460685429)` | tham số là một giá trị xác suất. | 1.0000000000000002 |
| **PEARSON** | Tính hệ số tương quan tích moment Pearson. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | tham số làhai mảng giá trị số, biểu thị hai tập dữ liệu. | 0.6993786061802354 |
| **PERCENTILEEXC** | tínhphân vị phần trăm loại trừ. | `PERCENTILEEXC([1,2,3,4], 0.3)` | tham số lần lượt làmảng giá trị số, giá trị k. | 1.5 |
| **PERCENTILEINC** | tínhphân vị phần trăm bao gồm. | `PERCENTILEINC([1,2,3,4], 0.3)` | tham số lần lượt làmảng giá trị số, giá trị k. | 1.9 |
| **PERCENTRANKEXC** | tínhthứ hạng phần trăm loại trừ. | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | tham số lần lượt làmảng giá trị số, giá trị x, mức ý nghĩa(tùy chọn). | 0.4 |
| **PERCENTRANKINC** | tínhthứ hạng phần trăm bao gồm. | `PERCENTRANKINC([1,2,3,4], 2, 2)` | tham số lần lượt làmảng giá trị số, giá trị x, mức ý nghĩa(tùy chọn). | 0.33 |
| **PERMUT** | Tính số hoán vị. | `PERMUT(100, 3)` | tham số lần lượt làtổng sốn, số được chọn k. | 970200 |
| **PERMUTATIONA** | tínhcho phép lặp số hoán vị. | `PERMUTATIONA(4, 3)` | tham số lần lượt làtổng sốn, số được chọn k. | 64 |
| **PHI** | tínhphân phối chuẩn tắc hàm mật độ. | `PHI(0.75)` | tham số là một giá trị số, biểu thịđiểm z. | 0.30113743215480443 |
| **POISSONDIST** | tínhPoissonphân phối. | `POISSONDIST(2, 5, true)` | tham số lần lượt làsố lần sự kiện, giá trị trung bình, cờ tích lũy. | 0.12465201948308113 |
| **PROB** | tínhxác suấttổng . | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | tham số lần lượt làmảng giá trị số, xác suấtmảng, cận dưới, cận trên. | 0.4 |
| **QUARTILEEXC** | tínhtứ phân vị loại trừ. | `QUARTILEEXC([1,2,3,4], 1)` | tham số lần lượt làmảng giá trị số, giá trị tứ phân vị. | 1.25 |
| **QUARTILEINC** | tínhbao gồm4điểm số chữ số. | `QUARTILEINC([1,2,3,4], 1)` | tham số lần lượt làmảng giá trị số, giá trị tứ phân vị. | 1.75 |
| **RANKAVG** | tínhtrung bìnhthứ hạng. | `RANKAVG(4, [2,4,4,8,8,16], false)` | tham số lần lượt là giá trị số, mảng giá trị số, sắp xếpkiểu(tăng dần/giảm dần). | 4.5 |
| **RANKEQ** | tínhgiá trị chỉ định thứ hạng. | `RANKEQ(4, [2,4,4,8,8,16], false)` | tham số lần lượt là giá trị số, mảng giá trị số, sắp xếpkiểu(tăng dần/giảm dần). | 4 |
| **RSQ** | Tính hệ số xác định. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | tham số làhai mảng giá trị số, biểu thị hai tập dữ liệu. | 0.4891304347826088 |
| **SKEW** | Tính độ lệch. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | tham số là mảng giá trị số, biểu thị các điểm dữ liệu. | 0.3595430714067974 |
| **SKEWP** | tínhdựa trên tổng thể độ lệch. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | tham số là mảng giá trị số, biểu thị các điểm dữ liệu. | 0.303193339354144 |
| **SLOPE** | Tính hệ số góc của hồi quy tuyến tính. | `SLOPE([1,9,5,7], [0,4,2,3])` | tham số lần lượt làđã biếtgiá trị ymảng, đã biếtgiá trị xmảng. | 2 |
| **SMALL** | trả vềthứ k nhỏ  giá trị. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | tham số lần lượt làmảng giá trị số, giá trị k. | 3 |
| **STANDARDIZE** | Chuẩn hóa giá trị thành điểm z. | `STANDARDIZE(42, 40, 1.5)` | tham số lần lượt là giá trị, giá trị trung bình, độ lệch chuẩn. | 1.3333333333333333 |
| **STDEVA** | tínhbao gồmvăn bản và giá trị logic độ lệch chuẩn. | `STDEVA([2,4], [8,16], [true, false])` | tham số là mảng giá trị số, văn bản hoặc giá trị logic. | 6.013872850889572 |
| **STDEVP** | tínhtổng thểđộ lệch chuẩn. | `STDEVP([2,4], [8,16], [true, false])` | tham số là mảng giá trị số. | 5.361902647381804 |
| **STDEVPA** | Tính độ lệch chuẩn của tổng thể bao gồm cả văn bản và giá trị logic. | `STDEVPA([2,4], [8,16], [true, false])` | tham số là mảng giá trị số, văn bản hoặc giá trị logic. | 5.489889697333535 |
| **STDEVS** | tínhmẫuđộ lệch chuẩn. | `VARS([2,4], [8,16], [true, false])` | tham số là mảng giá trị số. | 6.191391873668904 |
| **STEYX** | Tính sai số chuẩn của giá trị dự đoán. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | tham số lần lượt làđã biếtgiá trị ymảng, đã biếtgiá trị xmảng. | 3.305718950210041 |
| **TINV** | tínhtphân phối hàm nghịch đảo. | `TINV(0.9946953263673741, 1)` | tham số lần lượt là xác suất, bậc ký tự do. | 59.99999999996535 |
| **TRIMMEAN** | Tính giá trị trung bình tỉa. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | tham số lần lượt làmảng giá trị số, tỷ lệ tỉa. | 3.7777777777777777 |
| **VARA** | tínhbao gồmvăn bản và giá trị logic hiệu. | `VARA([2,4], [8,16], [true, false])` | tham số là mảng giá trị số, văn bản hoặc giá trị logic. | 36.16666666666667 |
| **VARP** | tínhtổng thểhiệu. | `VARP([2,4], [8,16], [true, false])` | tham số là mảng giá trị số. | 28.75 |
| **VARPA** | Tính phương sai của tổng thể bao gồm cả văn bản và giá trị logic. | `VARPA([2,4], [8,16], [true, false])` | tham số là mảng giá trị số, văn bản hoặc giá trị logic. | 30.13888888888889 |
| **VARS** | tínhmẫuhiệu. | `VARS([2,4], [8,16], [true, false])` | tham số là mảng giá trị số. | 38.333333333333336 |
| **WEIBULLDIST** | Tính phân phối Weibull. | `WEIBULLDIST(105, 20, 100, true)` | tham số lần lượt là giá trị, α, β, cờ tích lũy. | 0.9295813900692769 |
| **ZTEST** | Tính xác suất một đuôi của kiểm định z. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | tham số lần lượt làmảng giá trị số, giá trị trung bình giả định. | 0.09057419685136381 |

### Văn bản

| Function | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Chuyển đổi mã số thành ký tự tương ứng. | `CHAR(65)` | tham số làsố, biểu thịký tự mã hóa. | A |
| **CLEAN** | loại bỏtrong văn bản  tất cả không in đượcký tự. | `CLEAN('Monthly report')` | tham số là chuỗi văn bản cần làm sạch. | Monthly report |
| **CODE** | trả vềtrong chuỗi văn bản đầu tiênký tự mã số. | `CODE('A')` | tham số bao gồmmộtký tự chuỗi văn bản. | 65 |
| **CONCATENATE** | kết hợp nhiềuchuỗi văn bảnkết hợpvà là một chuỗi. | `CONCATENATE('Andreas', ' ', 'Hauser')` | tham số là một hoặc nhiềucần nối chuỗi văn bản. | Andreas Hauser |
| **EXACT** | Kiểm tra hai chuỗi có giống hệt nhau hay không, phân biệt chữ hoa chữ thường. | `EXACT('Word', 'word')` | tham số là hai chuỗi văn bản cần so sánh. | |
| **FIND** | Tìm vị trí của chuỗi con bắt đầu từ vị trí ban đầu. | `FIND('M', 'Miriam McGovern', 3)` | tham sốbao gồmcần tìm văn bản, văn bản nguồn và tùy chọn vị trí ban đầu. | 8 |
| **LEFT** | từ bên trái chuỗitrích xuấtsố lượng chỉ định ký tự. | `LEFT('Sale Price', 4)` | tham số làchuỗi văn bản và số ký tự tự cần trích xuất. | Sale |
| **LEN** | trả vềtrong chuỗi văn bản  số ký tự tự. | `LEN('Phoenix, AZ')` | tham số bao gồmcầnđếm chuỗi văn bản. | 11 |
| **LOWER** | tất cảký tựchuyển đổi thành  nhỏ viết. | `LOWER('E. E. Cummings')` | tham số làcần chuyển đổi chuỗi văn bản. | e. e. cummings |
| **MID** | Trích xuất số lượng ký tự chỉ định từ giữa chuỗi. | `MID('Fluid Flow', 7, 20)` | tham số làchuỗi văn bản, vị trí ban đầu và số ký tự tự cần trích xuất. | Flow |
| **NUMBERVALUE** | Chuyển đổi văn bản thành số dựa trên dấu phân cách chỉ định. | `NUMBERVALUE('2.500,27', ',', '.')` | tham số làchuỗi văn bản,  thập phândấu phân cách và hệdấu phân cách. | 2500.27 |
| **PROPER** | Viết hoa chữ cái đầu tiên của mỗi từ. | `PROPER('this is a TITLE')` | tham số làcần định dạng chuỗi văn bản. | This Is A Title |
| **REPLACE** | Thay thế phần văn bản cũ bằng văn bản mới. | `REPLACE('abcdefghijk', 6, 5, '*')` | tham số làvăn bản gốc, vị trí ban đầu, cầnthay thế số ký tự tự và văn bản mới. | abcde*k |
| **REPT** | dựa trênchỉ địnhsố lầnlặpvăn bản. | `REPT('*-', 3)` | tham số làchuỗi văn bản và lặpsố lần. | *-*-*- |
| **RIGHT** | từ chuỗibên phảitrích xuấtsố lượng chỉ định ký tự. | `RIGHT('Sale Price', 5)` | tham số làchuỗi văn bản và số ký tự tự cần trích xuất. | Price |
| **ROMAN** | số Ả Rậpchuyển đổi thành số La Mã. | `ROMAN(499)` | tham số làcần chuyển đổi số Ả Rập. | CDXCIX |
| **SEARCH** | Tìm chuỗi con trong văn bản, không phân biệt chữ hoa chữ thường. | `SEARCH('margin', 'Profit Margin')` | tham sốbao gồmcần tìm văn bản và văn bản nguồn. | 8 |
| **SUBSTITUTE** | sử dụngvăn bản mớithay thế trong văn bản cũ  phiên bản cụ thể. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | tham số làvăn bản gốc, cũvăn bản, văn bản mới và tùy chọn thay thếphiên bản. | Quarter 1, 2012 |
| **T** | Nếu tham số là văn bản, thì trả về văn bản đó; ngược lại trả về chuỗi rỗng. | `T('Rainfall')` | tham số có thể là kiểu dữ liệu bất kỳ. | Rainfall |
| **TRIM** | loại bỏtrước và sau văn bản rỗngcách, trongphần nhiều tạimột rỗngcáchgiữ lại là một. | `TRIM(' First Quarter Earnings ')` | tham số làcần tỉa chuỗi văn bản. | First Quarter Earnings |
| **TEXTJOIN** | Kết hợp nhiều mục văn bản thành một chuỗi, sử dụngdấu phân cách chỉ định. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | tham số làdấu phân cách, cờ bỏ qua giá trị rỗng và cần nối mục văn bản. | The sun will come up tomorrow. |
| **UNICHAR** | trả vềđã choUnicodesốtương ứng ký tự. | `UNICHAR(66)` | tham số làUnicodeký tựmã. | B |
| **UNICODE** | trả vềvăn bản đầu tiênký tự Unicodesố. | `UNICODE('B')` | tham số bao gồmmộtký tự chuỗi văn bản. | 66 |
| **UPPER** | tất cảký tựchuyển đổi thành  lớn viết. | `UPPER('total')` | tham số làcần chuyển đổi chuỗi văn bản. | TOTAL |
