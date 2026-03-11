:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/calculation-engine/formula).
:::

# Formula.js

[Formula.js](http://formulajs.info/) cung cấp một bộ sưu tập lớn các hàm tương thích với Excel.

## Danh sách hàm tham chiếu

### Ngày tháng

| Hàm | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **DATE** | Tạo một ngày dựa trên năm, tháng và ngày được cung cấp. | `DATE(2008, 7, 8)` | Năm (số nguyên), tháng (1-12), ngày (1-31). | Tue Jul 08 2008 00:00:00 GMT-0700 (PDT) |
| **DATEVALUE** | Chuyển đổi một ngày ở định dạng văn bản thành số sê-ri ngày. | `DATEVALUE('8/22/2011')` | Chuỗi văn bản đại diện cho một ngày. | Mon Aug 22 2011 00:00:00 GMT-0700 (PDT) |
| **DAY** | Trả về phần ngày của một giá trị ngày. | `DAY('15-Apr-11')` | Giá trị ngày hoặc chuỗi văn bản ngày. | 15 |
| **DAYS** | Tính số ngày giữa hai ngày. | `DAYS('3/15/11', '2/1/11')` | Ngày kết thúc, ngày bắt đầu. | 42 |
| **DAYS360** | Tính số ngày giữa hai ngày dựa trên năm có 360 ngày. | `DAYS360('1-Jan-11', '31-Dec-11')` | Ngày bắt đầu, ngày kết thúc. | 360 |
| **EDATE** | Trả về ngày trước hoặc sau một số tháng nhất định so với ngày bắt đầu. | `EDATE('1/15/11', -1)` | Ngày bắt đầu, số tháng (số dương cho tương lai, số âm cho quá khứ). | Wed Dec 15 2010 00:00:00 GMT-0800 (PST) |
| **EOMONTH** | Trả về ngày cuối cùng của tháng trước hoặc sau một số tháng nhất định. | `EOMONTH('1/1/11', -3)` | Ngày bắt đầu, số tháng (số dương cho tương lai, số âm cho quá khứ). | Sun Oct 31 2010 00:00:00 GMT-0700 (PDT) |
| **HOUR** | Trả về phần giờ của một giá trị thời gian. | `HOUR('7/18/2011 7:45:00 AM')` | Giá trị thời gian hoặc chuỗi văn bản thời gian. | 7 |
| **MINUTE** | Trả về phần phút của một giá trị thời gian. | `MINUTE('2/1/2011 12:45:00 PM')` | Giá trị thời gian hoặc chuỗi văn bản thời gian. | 45 |
| **ISOWEEKNUM** | Trả về số tuần ISO trong năm cho một ngày nhất định. | `ISOWEEKNUM('3/9/2012')` | Giá trị ngày hoặc chuỗi văn bản ngày. | 10 |
| **MONTH** | Trả về phần tháng của một ngày. | `MONTH('15-Apr-11')` | Giá trị ngày hoặc chuỗi văn bản ngày. | 4 |
| **NETWORKDAYS** | Đếm số ngày làm việc giữa hai ngày, không bao gồm cuối tuần và các ngày lễ tùy chọn. | `NETWORKDAYS('10/1/2012', '3/1/2013', ['11/22/2012'])` | Ngày bắt đầu, ngày kết thúc, mảng các ngày lễ tùy chọn. | 109 |
| **NETWORKDAYSINTL** | Đếm số ngày làm việc giữa hai ngày, cho phép tùy chỉnh cuối tuần và các ngày lễ tùy chọn. | `NETWORKDAYSINTL('1/1/2006', '2/1/2006', 7, ['1/2/2006'])` | Ngày bắt đầu, ngày kết thúc, chế độ cuối tuần, mảng các ngày lễ tùy chọn. | 23 |
| **NOW** | Trả về ngày và giờ hiện tại. | `NOW()` | Không có tham số. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **SECOND** | Trả về phần giây của một giá trị thời gian. | `SECOND('2/1/2011 4:48:18 PM')` | Giá trị thời gian hoặc chuỗi văn bản thời gian. | 18 |
| **TIME** | Tạo một giá trị thời gian từ giờ, phút và giây được cung cấp. | `TIME(16, 48, 10)` | Giờ (0-23), phút (0-59), giây (0-59). | 0.7001157407407408 |
| **TIMEVALUE** | Chuyển đổi thời gian ở định dạng văn bản thành số sê-ri thời gian. | `TIMEVALUE('22-Aug-2011 6:35 AM')` | Chuỗi văn bản đại diện cho thời gian. | 0.2743055555555556 |
| **TODAY** | Trả về ngày hiện tại. | `TODAY()` | Không có tham số. | Thu Feb 20 2020 23:02:55 GMT+0100 (Central European Standard Time) |
| **WEEKDAY** | Trả về số tương ứng với ngày trong tuần. | `WEEKDAY('2/14/2008', 3)` | Giá trị ngày hoặc chuỗi văn bản ngày, loại trả về (1-3). | 3 |
| **YEAR** | Trả về phần năm của một ngày. | `YEAR('7/5/2008')` | Giá trị ngày hoặc chuỗi văn bản ngày. | 2008 |
| **WEEKNUM** | Trả về số tuần trong năm cho một ngày nhất định. | `WEEKNUM('3/9/2012', 2)` | Giá trị ngày hoặc chuỗi văn bản ngày, ngày bắt đầu tuần tùy chọn (1=Chủ Nhật, 2=Thứ Hai). | 11 |
| **WORKDAY** | Trả về ngày trước hoặc sau một số ngày làm việc nhất định, không bao gồm cuối tuần và các ngày lễ tùy chọn. | `WORKDAY('10/1/2008', 151, ['11/26/2008', '12/4/2008'])` | Ngày bắt đầu, số ngày làm việc, mảng các ngày lễ tùy chọn. | Mon May 04 2009 00:00:00 GMT-0700 (PDT) |
| **WORKDAYINTL** | Trả về ngày trước hoặc sau một số ngày làm việc với tùy chỉnh cuối tuần và các ngày lễ tùy chọn. | `WORKDAYINTL('1/1/2012', 30, 17)` | Ngày bắt đầu, số ngày làm việc, chế độ cuối tuần. | Sun Feb 05 2012 00:00:00 GMT-0800 (PST) |
| **YEARFRAC** | Tính tỷ lệ phần năm giữa hai ngày. | `YEARFRAC('1/1/2012', '7/30/2012', 3)` | Ngày bắt đầu, ngày kết thúc, cơ sở tùy chọn (cơ sở đếm ngày). | 0.5780821917808219 |

### Tài chính

| Hàm | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **ACCRINT** | Tính lãi tích lũy cho chứng khoán trả lãi định kỳ. | `ACCRINT('01/01/2011', '02/01/2011', '07/01/2014', 0.1, 1000, 1, 0)` | Ngày phát hành, ngày trả lãi đầu tiên, ngày thanh toán, lãi suất năm, mệnh giá, tần suất, cơ sở. | 350 |
| **CUMIPMT** | Tính lãi lũy kế đã trả cho một loạt các khoản thanh toán. | `CUMIPMT(0.1/12, 30*12, 100000, 13, 24, 0)` | Lãi suất, tổng số kỳ, giá trị hiện tại, kỳ bắt đầu, kỳ kết thúc, loại thanh toán (0=cuối kỳ, 1=đầu kỳ). | -9916.77251395708 |
| **CUMPRINC** | Tính vốn gốc lũy kế đã trả cho một loạt các khoản thanh toán. | `CUMPRINC(0.1/12, 30*12, 100000, 13, 24, 0)` | Lãi suất, tổng số kỳ, giá trị hiện tại, kỳ bắt đầu, kỳ kết thúc, loại thanh toán (0=cuối kỳ, 1=đầu kỳ). | -614.0863271085149 |
| **DB** | Tính khấu hao bằng phương pháp số dư giảm dần cố định. | `DB(1000000, 100000, 6, 1, 6)` | Chi phí, giá trị tận dụng, tuổi thọ, kỳ, tháng. | 159500 |
| **DDB** | Tính khấu hao bằng phương pháp số dư giảm dần kép hoặc phương pháp xác định khác. | `DDB(1000000, 100000, 6, 1, 1.5)` | Chi phí, giá trị tận dụng, tuổi thọ, kỳ, hệ số. | 250000 |
| **DOLLARDE** | Chuyển đổi giá được biểu diễn dưới dạng phân số sang số thập phân. | `DOLLARDE(1.1, 16)` | Giá dưới dạng đô la phân số, mẫu số. | 1.625 |
| **DOLLARFR** | Chuyển đổi giá được biểu diễn dưới dạng số thập phân sang phân số. | `DOLLARFR(1.625, 16)` | Giá dưới dạng đô la thập phân, mẫu số. | 1.1 |
| **EFFECT** | Tính lãi suất năm thực tế. | `EFFECT(0.1, 4)` | Lãi suất danh nghĩa hàng năm, số kỳ tính lãi kép mỗi năm. | 0.10381289062499977 |
| **FV** | Tính giá trị tương lai của một khoản đầu tư. | `FV(0.1/12, 10, -100, -1000, 0)` | Lãi suất mỗi kỳ, số kỳ, khoản thanh toán mỗi kỳ, giá trị hiện tại, loại thanh toán (0=cuối kỳ, 1=đầu kỳ). | 2124.874409194097 |
| **FVSCHEDULE** | Tính giá trị tương lai của vốn gốc bằng cách sử dụng một loạt các lãi suất kép. | `FVSCHEDULE(100, [0.09,0.1,0.11])` | Vốn gốc, mảng lãi suất. | 133.08900000000003 |
| **IPMT** | Tính khoản thanh toán lãi cho một kỳ cụ thể. | `IPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Lãi suất mỗi kỳ, kỳ, tổng số kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán (0=cuối kỳ, 1=đầu kỳ). | 928.8235718400465 |
| **IRR** | Tính tỷ suất hoàn vốn nội bộ. | `IRR([-75000,12000,15000,18000,21000,24000], 0.075)` | Mảng các dòng tiền, ước tính. | 0.05715142887178447 |
| **ISPMT** | Tính lãi đã trả trong một kỳ cụ thể (đối với các khoản vay). | `ISPMT(0.1/12, 6, 2*12, 100000)` | Lãi suất mỗi kỳ, kỳ, tổng số kỳ, số tiền vay. | -625 |
| **MIRR** | Tính tỷ suất hoàn vốn nội bộ có điều chỉnh. | `MIRR([-75000,12000,15000,18000,21000,24000], 0.1, 0.12)` | Mảng các dòng tiền, lãi suất tài trợ, lãi suất tái đầu tư. | 0.07971710360838036 |
| **NOMINAL** | Tính lãi suất năm danh nghĩa. | `NOMINAL(0.1, 4)` | Lãi suất thực tế hàng năm, số kỳ tính lãi kép mỗi năm. | 0.09645475633778045 |
| **NPER** | Tính số kỳ cần thiết để đạt được giá trị mục tiêu. | `NPER(0.1/12, -100, -1000, 10000, 0)` | Lãi suất mỗi kỳ, khoản thanh toán mỗi kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán (0=cuối kỳ, 1=đầu kỳ). | 63.39385422740764 |
| **NPV** | Tính giá trị hiện tại thuần của một loạt các dòng tiền trong tương lai. | `NPV(0.1, -10000, 2000, 4000, 8000)` | Tỷ lệ chiết khấu mỗi kỳ, mảng các dòng tiền. | 1031.3503176012546 |
| **PDURATION** | Tính thời gian cần thiết để đạt được một giá trị mong muốn. | `PDURATION(0.1, 1000, 2000)` | Lãi suất mỗi kỳ, giá trị hiện tại, giá trị tương lai. | 7.272540897341714 |
| **PMT** | Tính khoản thanh toán định kỳ cho một khoản vay. | `PMT(0.1/12, 2*12, 1000, 10000, 0)` | Lãi suất mỗi kỳ, tổng số kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán (0=cuối kỳ, 1=đầu kỳ). | -42426.08563793503 |
| **PPMT** | Tính khoản thanh toán vốn gốc cho một kỳ cụ thể. | `PPMT(0.1/12, 6, 2*12, 100000, 1000000, 0)` | Lãi suất mỗi kỳ, kỳ, tổng số kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán (0=cuối kỳ, 1=đầu kỳ). | -43354.909209775076 |
| **PV** | Tính giá trị hiện tại của một khoản đầu tư. | `PV(0.1/12, 2*12, 1000, 10000, 0)` | Lãi suất mỗi kỳ, số kỳ, khoản thanh toán mỗi kỳ, giá trị tương lai, loại thanh toán (0=cuối kỳ, 1=đầu kỳ). | -29864.950264779152 |
| **RATE** | Tính lãi suất cho mỗi kỳ. | `RATE(2*12, -1000, -10000, 100000, 0, 0.1)` | Tổng số kỳ, khoản thanh toán mỗi kỳ, giá trị hiện tại, giá trị tương lai, loại thanh toán (0=cuối kỳ, 1=đầu kỳ), ước tính. | 0.06517891177181533 |

### Kỹ thuật

| Hàm | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **BIN2DEC** | Chuyển đổi số nhị phân sang thập phân. | `BIN2DEC(101010)` | Số nhị phân. | 42 |
| **BIN2HEX** | Chuyển đổi số nhị phân sang thập lục phân. | `BIN2HEX(101010)` | Số nhị phân. | 2a |
| **BIN2OCT** | Chuyển đổi số nhị phân sang bát phân. | `BIN2OCT(101010)` | Số nhị phân. | 52 |
| **BITAND** | Trả về phép toán AND theo bit của hai số. | `BITAND(42, 24)` | Số nguyên, số nguyên. | 8 |
| **BITLSHIFT** | Thực hiện phép dịch trái theo bit. | `BITLSHIFT(42, 24)` | Số nguyên, số bit cần dịch. | 704643072 |
| **BITOR** | Trả về phép toán OR theo bit của hai số. | `BITOR(42, 24)` | Số nguyên, số nguyên. | 58 |
| **BITRSHIFT** | Thực hiện phép dịch phải theo bit. | `BITRSHIFT(42, 2)` | Số nguyên, số bit cần dịch. | 10 |
| **BITXOR** | Trả về phép toán XOR theo bit của hai số. | `BITXOR(42, 24)` | Số nguyên, số nguyên. | 50 |
| **COMPLEX** | Tạo một số phức. | `COMPLEX(3, 4)` | Phần thực, phần ảo. | 3+4i |
| **CONVERT** | Chuyển đổi một số từ đơn vị đo lường này sang đơn vị đo lường khác. | `CONVERT(64, 'kibyte', 'bit')` | Giá trị, đơn vị gốc, đơn vị đích. | 524288 |
| **DEC2BIN** | Chuyển đổi số thập phân sang nhị phân. | `DEC2BIN(42)` | Số thập phân. | 101010 |
| **DEC2HEX** | Chuyển đổi số thập phân sang thập lục phân. | `DEC2HEX(42)` | Số thập phân. | 2a |
| **DEC2OCT** | Chuyển đổi số thập phân sang bát phân. | `DEC2OCT(42)` | Số thập phân. | 52 |
| **DELTA** | Kiểm tra xem hai giá trị có bằng nhau hay không. | `DELTA(42, 42)` | Số, số. | 1 |
| **ERF** | Trả về hàm lỗi. | `ERF(1)` | Giới hạn trên. | 0.8427007929497149 |
| **ERFC** | Trả về hàm lỗi bù. | `ERFC(1)` | Giới hạn dưới. | 0.1572992070502851 |
| **GESTEP** | Kiểm tra xem một số có lớn hơn hoặc bằng một ngưỡng hay không. | `GESTEP(42, 24)` | Số, ngưỡng. | 1 |
| **HEX2BIN** | Chuyển đổi số thập lục phân sang nhị phân. | `HEX2BIN('2a')` | Số thập lục phân. | 101010 |
| **HEX2DEC** | Chuyển đổi số thập lục phân sang thập phân. | `HEX2DEC('2a')` | Số thập lục phân. | 42 |
| **HEX2OCT** | Chuyển đổi số thập lục phân sang bát phân. | `HEX2OCT('2a')` | Số thập lục phân. | 52 |
| **IMABS** | Trả về giá trị tuyệt đối (mô-đun) của một số phức. | `IMABS('3+4i')` | Số phức. | 5 |
| **IMAGINARY** | Trả về phần ảo của một số phức. | `IMAGINARY('3+4i')` | Số phức. | 4 |
| **IMARGUMENT** | Trả về đối số (argument) của một số phức. | `IMARGUMENT('3+4i')` | Số phức. | 0.9272952180016122 |
| **IMCONJUGATE** | Trả về số phức liên hợp. | `IMCONJUGATE('3+4i')` | Số phức. | 3-4i |
| **IMCOS** | Trả về cosin của một số phức. | `IMCOS('1+i')` | Số phức. | 0.8337300251311491-0.9888977057628651i |
| **IMCOSH** | Trả về cosin hyperbol của một số phức. | `IMCOSH('1+i')` | Số phức. | 0.8337300251311491+0.9888977057628651i |
| **IMCOT** | Trả về cotang của một số phức. | `IMCOT('1+i')` | Số phức. | 0.21762156185440265-0.8680141428959249i |
| **IMCSC** | Trả về cosecant của một số phức. | `IMCSC('1+i')` | Số phức. | 0.6215180171704283-0.3039310016284264i |
| **IMCSCH** | Trả về cosecant hyperbol của một số phức. | `IMCSCH('1+i')` | Số phức. | 0.3039310016284264-0.6215180171704283i |
| **IMDIV** | Trả về thương của hai số phức. | `IMDIV('1+2i', '3+4i')` | Số phức bị chia, số phức chia. | 0.44+0.08i |
| **IMEXP** | Trả về hàm mũ của một số phức. | `IMEXP('1+i')` | Số phức. | 1.4686939399158851+2.2873552871788423i |
| **IMLN** | Trả về logarit tự nhiên của một số phức. | `IMLN('1+i')` | Số phức. | 0.3465735902799727+0.7853981633974483i |
| **IMLOG10** | Trả về logarit cơ số 10 của một số phức. | `IMLOG10('1+i')` | Số phức. | 0.1505149978319906+0.3410940884604603i |
| **IMLOG2** | Trả về logarit cơ số 2 của một số phức. | `IMLOG2('1+i')` | Số phức. | 0.5000000000000001+1.1330900354567985i |
| **IMPOWER** | Trả về một số phức được nâng lên một lũy thừa. | `IMPOWER('1+i', 2)` | Số phức, số mũ. | 1.2246063538223775e-16+2.0000000000000004i |
| **IMPRODUCT** | Trả về tích của các số phức. | `IMPRODUCT('1+2i', '3+4i', '5+6i')` | Mảng các số phức. | -85+20i |
| **IMREAL** | Trả về phần thực của một số phức. | `IMREAL('3+4i')` | Số phức. | 3 |
| **IMSEC** | Trả về secant của một số phức. | `IMSEC('1+i')` | Số phức. | 0.4983370305551868+0.591083841721045i |
| **IMSECH** | Trả về secant hyperbol của một số phức. | `IMSECH('1+i')` | Số phức. | 0.4983370305551868-0.591083841721045i |
| **IMSIN** | Trả về sin của một số phức. | `IMSIN('1+i')` | Số phức. | 1.2984575814159773+0.6349639147847361i |
| **IMSINH** | Trả về sin hyperbol của một số phức. | `IMSINH('1+i')` | Số phức. | 0.6349639147847361+1.2984575814159773i |
| **IMSQRT** | Trả về căn bậc hai của một số phức. | `IMSQRT('1+i')` | Số phức. | 1.0986841134678098+0.45508986056222733i |
| **IMSUB** | Trả về hiệu giữa hai số phức. | `IMSUB('3+4i', '1+2i')` | Số phức bị trừ, số phức trừ. | 2+2i |
| **IMSUM** | Trả về tổng của các số phức. | `IMSUM('1+2i', '3+4i', '5+6i')` | Mảng các số phức. | 9+12i |
| **IMTAN** | Trả về tang của một số phức. | `IMTAN('1+i')` | Số phức. | 0.2717525853195117+1.0839233273386946i |
| **OCT2BIN** | Chuyển đổi số bát phân sang nhị phân. | `OCT2BIN('52')` | Số bát phân. | 101010 |
| **OCT2DEC** | Chuyển đổi số bát phân sang thập phân. | `OCT2DEC('52')` | Số bát phân. | 42 |
| **OCT2HEX** | Chuyển đổi số bát phân sang thập lục phân. | `OCT2HEX('52')` | Số bát phân. | 2a |

### Logic

| Hàm | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **AND** | Trả về TRUE chỉ khi tất cả các đối số là TRUE, ngược lại là FALSE. | `AND(true, false, true)` | Một hoặc nhiều giá trị logic (Boolean); hàm chỉ trả về TRUE khi mọi đối số đều là TRUE. | |
| **FALSE** | Trả về giá trị logic FALSE. | `FALSE()` | Không có tham số. | |
| **IF** | Trả về các giá trị khác nhau tùy thuộc vào điều kiện là TRUE hay FALSE. | `IF(true, 'Hello!', 'Goodbye!')` | Điều kiện, giá trị nếu TRUE, giá trị nếu FALSE. | Hello! |
| **IFS** | Đánh giá nhiều điều kiện và trả về kết quả của điều kiện TRUE đầu tiên. | `IFS(false, 'Hello!', true, 'Goodbye!')` | Nhiều cặp điều kiện và giá trị tương ứng. | Goodbye! |
| **NOT** | Đảo ngược một giá trị logic. TRUE trở thành FALSE và ngược lại. | `NOT(true)` | Một giá trị logic (Boolean). | |
| **OR** | Trả về TRUE nếu bất kỳ đối số nào là TRUE, ngược lại là FALSE. | `OR(true, false, true)` | Một hoặc nhiều giá trị logic (Boolean); trả về TRUE khi có bất kỳ đối số nào là TRUE. | |
| **SWITCH** | Trả về giá trị khớp với một biểu thức; nếu không có kết quả khớp, trả về giá trị mặc định. | `SWITCH(7, 9, 'Nine', 7, 'Seven')` | Biểu thức, giá trị khớp 1, kết quả 1, …, [mặc định]. | Seven |
| **TRUE** | Trả về giá trị logic TRUE. | `TRUE()` | Không có tham số. | |
| **XOR** | Trả về TRUE chỉ khi có một số lẻ các đối số là TRUE, ngược lại là FALSE. | `XOR(true, false, true)` | Một hoặc nhiều giá trị logic (Boolean); trả về TRUE khi số lượng giá trị TRUE là số lẻ. | |

### Toán học

| Hàm | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **ABS** | Trả về giá trị tuyệt đối của một số. | `ABS(-4)` | Số. | 4 |
| **ACOS** | Trả về arccosine (tính bằng radian). | `ACOS(-0.5)` | Số trong khoảng từ -1 đến 1. | 2.0943951023931957 |
| **ACOSH** | Trả về cosine hyperbol nghịch đảo. | `ACOSH(10)` | Số lớn hơn hoặc bằng 1. | 2.993222846126381 |
| **ACOT** | Trả về arccotangent (tính bằng radian). | `ACOT(2)` | Bất kỳ số nào. | 0.46364760900080615 |
| **ACOTH** | Trả về cotang hyperbol nghịch đảo. | `ACOTH(6)` | Số có giá trị tuyệt đối lớn hơn 1. | 0.16823611831060645 |
| **AGGREGATE** | Thực hiện tính toán tổng hợp trong khi bỏ qua các lỗi hoặc các hàng bị ẩn. | `AGGREGATE(9, 4, [-5,15], [32,'Hello World!'])` | Mã hàm, tùy chọn, mảng 1, …, mảng N. | 10,32 |
| **ARABIC** | Chuyển đổi số La Mã sang số Ả Rập. | `ARABIC('MCMXII')` | Chuỗi số La Mã. | 1912 |
| **ASIN** | Trả về arcsine (tính bằng radian). | `ASIN(-0.5)` | Số trong khoảng từ -1 đến 1. | -0.5235987755982988 |
| **ASINH** | Trả về sine hyperbol nghịch đảo. | `ASINH(-2.5)` | Bất kỳ số nào. | -1.6472311463710965 |
| **ATAN** | Trả về arctangent (tính bằng radian). | `ATAN(1)` | Bất kỳ số nào. | 0.7853981633974483 |
| **ATAN2** | Trả về arctangent (tính bằng radian) của một cặp tọa độ. | `ATAN2(-1, -1)` | tọa độ y, tọa độ x. | -2.356194490192345 |
| **ATANH** | Trả về tang hyperbol nghịch đảo. | `ATANH(-0.1)` | Số trong khoảng từ -1 đến 1. | -0.10033534773107562 |
| **BASE** | Chuyển đổi một số thành văn bản ở cơ số được chỉ định. | `BASE(15, 2, 10)` | Số, cơ số, [độ dài tối thiểu]. | 0000001111 |
| **CEILING** | Làm tròn một số lên đến bội số gần nhất. | `CEILING(-5.5, 2, -1)` | Số, bội số, [chế độ]. | -6 |
| **CEILINGMATH** | Làm tròn một số lên, sử dụng bội số và hướng được cung cấp. | `CEILINGMATH(-5.5, 2, -1)` | Số, [bội số], [chế độ]. | -6 |
| **CEILINGPRECISE** | Làm tròn một số lên đến bội số gần nhất, bỏ qua dấu. | `CEILINGPRECISE(-4.1, -2)` | Số, [bội số]. | -4 |
| **COMBIN** | Trả về số tổ hợp. | `COMBIN(8, 2)` | Tổng số phần tử, số phần tử được chọn. | 28 |
| **COMBINA** | Trả về số tổ hợp có lặp lại. | `COMBINA(4, 3)` | Tổng số phần tử, số phần tử được chọn. | 20 |
| **COS** | Trả về cosine (tính bằng radian). | `COS(1)` | Góc tính bằng radian. | 0.5403023058681398 |
| **COSH** | Trả về cosine hyperbol. | `COSH(1)` | Bất kỳ số nào. | 1.5430806348152437 |
| **COT** | Trả về cotang (tính bằng radian). | `COT(30)` | Góc tính bằng radian. | -0.15611995216165922 |
| **COTH** | Trả về cotang hyperbol. | `COTH(2)` | Bất kỳ số nào. | 1.0373147207275482 |
| **CSC** | Trả về cosecant (tính bằng radian). | `CSC(15)` | Góc tính bằng radian. | 1.5377805615408537 |
| **CSCH** | Trả về cosecant hyperbol. | `CSCH(1.5)` | Bất kỳ số nào. | 0.46964244059522464 |
| **DECIMAL** | Chuyển đổi một số ở dạng văn bản sang số thập phân. | `DECIMAL('FF', 16)` | Văn bản, cơ số. | 255 |
| **ERF** | Trả về hàm lỗi. | `ERF(1)` | Giới hạn trên. | 0.8427007929497149 |
| **ERFC** | Trả về hàm lỗi bù. | `ERFC(1)` | Giới hạn dưới. | 0.1572992070502851 |
| **EVEN** | Làm tròn một số lên đến số nguyên chẵn gần nhất. | `EVEN(-1)` | Số. | -2 |
| **EXP** | Trả về e nâng lên một lũy thừa. | `EXP(1)` | Số mũ. | 2.718281828459045 |
| **FACT** | Trả về giai thừa. | `FACT(5)` | Số nguyên không âm. | 120 |
| **FACTDOUBLE** | Trả về giai thừa kép. | `FACTDOUBLE(7)` | Số nguyên không âm. | 105 |
| **FLOOR** | Làm tròn một số xuống đến bội số gần nhất. | `FLOOR(-3.1)` | Số, bội số. | -4 |
| **FLOORMATH** | Làm tròn một số xuống bằng cách sử dụng bội số và hướng được cung cấp. | `FLOORMATH(-4.1, -2, -1)` | Số, [bội số], [chế độ]. | -4 |
| **FLOORPRECISE** | Làm tròn một số xuống đến bội số gần nhất, bỏ qua dấu. | `FLOORPRECISE(-3.1, -2)` | Số, [bội số]. | -4 |
| **GCD** | Trả về ước chung lớn nhất. | `GCD(24, 36, 48)` | Hai hoặc nhiều số nguyên. | 12 |
| **INT** | Làm tròn một số xuống đến số nguyên gần nhất. | `INT(-8.9)` | Số. | -9 |
| **ISEVEN** | Kiểm tra xem một số có phải là số chẵn hay không. | `ISEVEN(-2.5)` | Số. | |
| **ISOCEILING** | Làm tròn một số lên đến bội số gần nhất theo quy tắc ISO. | `ISOCEILING(-4.1, -2)` | Số, [bội số]. | -4 |
| **ISODD** | Kiểm tra xem một số có phải là số lẻ hay không. | `ISODD(-2.5)` | Số. | |
| **LCM** | Trả về bội chung nhỏ nhất. | `LCM(24, 36, 48)` | Hai hoặc nhiều số nguyên. | 144 |
| **LN** | Trả về logarit tự nhiên. | `LN(86)` | Số dương. | 4.454347296253507 |
| **LOG** | Trả về logarit theo cơ số được chỉ định. | `LOG(8, 2)` | Số, cơ số. | 3 |
| **LOG10** | Trả về logarit cơ số 10. | `LOG10(100000)` | Số dương. | 5 |
| **MOD** | Trả về số dư của một phép chia. | `MOD(3, -2)` | Số bị chia, số chia. | -1 |
| **MROUND** | Làm tròn một số đến bội số gần nhất. | `MROUND(-10, -3)` | Số, bội số. | -9 |
| **MULTINOMIAL** | Trả về hệ số đa thức. | `MULTINOMIAL(2, 3, 4)` | Hai hoặc nhiều số nguyên không âm. | 1260 |
| **ODD** | Làm tròn một số lên đến số nguyên lẻ gần nhất. | `ODD(-1.5)` | Số. | -3 |
| **POWER** | Nâng một số lên một lũy thừa. | `POWER(5, 2)` | Cơ số, số mũ. | 25 |
| **PRODUCT** | Trả về tích của các số. | `PRODUCT(5, 15, 30)` | Một hoặc nhiều số. | 2250 |
| **QUOTIENT** | Trả về phần nguyên của một phép chia. | `QUOTIENT(-10, 3)` | Số bị chia, số chia. | -3 |
| **RADIANS** | Chuyển đổi độ sang radian. | `RADIANS(180)` | Độ. | 3.141592653589793 |
| **RAND** | Trả về một số thực ngẫu nhiên từ 0 đến 1. | `RAND()` | Không có tham số. | [Số thực ngẫu nhiên từ 0 đến 1] |
| **RANDBETWEEN** | Trả về một số nguyên ngẫu nhiên trong một phạm vi được chỉ định. | `RANDBETWEEN(-1, 1)` | Cận dưới, cận trên. | [Số nguyên ngẫu nhiên giữa cận dưới và cận trên] |
| **ROUND** | Làm tròn một số đến số chữ số được chỉ định. | `ROUND(626.3, -3)` | Số, số chữ số. | 1000 |
| **ROUNDDOWN** | Làm tròn một số xuống về phía số không. | `ROUNDDOWN(-3.14159, 2)` | Số, số chữ số. | -3.14 |
| **ROUNDUP** | Làm tròn một số lên ra xa số không. | `ROUNDUP(-3.14159, 2)` | Số, số chữ số. | -3.15 |
| **SEC** | Trả về secant (tính bằng radian). | `SEC(45)` | Góc tính bằng radian. | 1.9035944074044246 |
| **SECH** | Trả về secant hyperbol. | `SECH(45)` | Bất kỳ số nào. | 5.725037161098787e-20 |
| **SIGN** | Trả về dấu của một số. | `SIGN(-0.00001)` | Số. | -1 |
| **SIN** | Trả về sine (tính bằng radian). | `SIN(1)` | Góc tính bằng radian. | 0.8414709848078965 |
| **SINH** | Trả về sine hyperbol. | `SINH(1)` | Bất kỳ số nào. | 1.1752011936438014 |
| **SQRT** | Trả về căn bậc hai. | `SQRT(16)` | Số không âm. | 4 |
| **SQRTPI** | Trả về căn bậc hai của (số * π). | `SQRTPI(2)` | Số không âm. | 2.5066282746310002 |
| **SUBTOTAL** | Trả về tổng phụ cho một tập dữ liệu, bỏ qua các hàng bị ẩn. | `SUBTOTAL(9, [-5,15], [32,'Hello World!'])` | Mã hàm, mảng 1, …, mảng N. | 10,32 |
| **SUM** | Trả về tổng các số, bỏ qua văn bản. | `SUM(-5, 15, 32, 'Hello World!')` | Một hoặc nhiều số. | 42 |
| **SUMIF** | Tính tổng các giá trị đáp ứng một điều kiện duy nhất. | `SUMIF([2,4,8,16], '>5')` | Phạm vi, tiêu chí. | 24 |
| **SUMIFS** | Tính tổng các giá trị đáp ứng nhiều điều kiện. | `SUMIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Phạm vi tính tổng, phạm vi tiêu chí 1, tiêu chí 1, …, phạm vi tiêu chí N, tiêu chí N. | 12 |
| **SUMPRODUCT** | Trả về tổng các tích của các phần tử mảng. | `SUMPRODUCT([[1,2],[3,4]], [[1,0],[0,1]])` | Hai hoặc nhiều mảng. | 5 |
| **SUMSQ** | Trả về tổng các bình phương. | `SUMSQ(3, 4)` | Một hoặc nhiều số. | 25 |
| **SUMX2MY2** | Trả về tổng của hiệu các bình phương của các phần tử mảng tương ứng. | `SUMX2MY2([1,2], [3,4])` | Mảng 1, mảng 2. | -20 |
| **SUMX2PY2** | Trả về tổng của tổng các bình phương của các phần tử mảng tương ứng. | `SUMX2PY2([1,2], [3,4])` | Mảng 1, mảng 2. | 30 |
| **SUMXMY2** | Trả về tổng các bình phương của hiệu giữa các phần tử mảng tương ứng. | `SUMXMY2([1,2], [3,4])` | Mảng 1, mảng 2. | 8 |
| **TAN** | Trả về tang (tính bằng radian). | `TAN(1)` | Góc tính bằng radian. | 1.5574077246549023 |
| **TANH** | Trả về tang hyperbol. | `TANH(-2)` | Bất kỳ số nào. | -0.9640275800758168 |
| **TRUNC** | Cắt một số thành một số nguyên mà không làm tròn. | `TRUNC(-8.9)` | Số, [số chữ số]. | -8 |

### Thống kê

| Hàm | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **AVEDEV** | Trả về độ lệch tuyệt đối trung bình. | `AVEDEV([2,4], [8,16])` | Các mảng số đại diện cho các điểm dữ liệu. | 4.5 |
| **AVERAGE** | Trả về trung bình cộng. | `AVERAGE([2,4], [8,16])` | Các mảng số đại diện cho các điểm dữ liệu. | 7.5 |
| **AVERAGEA** | Trả về trung bình của các giá trị, bao gồm cả văn bản và giá trị logic. | `AVERAGEA([2,4], [8,16])` | Các mảng số, văn bản hoặc giá trị logic; tất cả các giá trị không trống đều được bao gồm. | 7.5 |
| **AVERAGEIF** | Tính trung bình dựa trên một điều kiện duy nhất. | `AVERAGEIF([2,4,8,16], '>5', [1, 2, 3, 4])` | Tham số đầu tiên là phạm vi cần kiểm tra, thứ hai là điều kiện, thứ ba là phạm vi tùy chọn dùng để tính trung bình. | 3.5 |
| **AVERAGEIFS** | Tính trung bình dựa trên nhiều điều kiện. | `AVERAGEIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Tham số đầu tiên là các giá trị cần tính trung bình, theo sau là các cặp phạm vi tiêu chí và biểu thức tiêu chí. | 6 |
| **BETADIST** | Trả về mật độ xác suất beta tích lũy. | `BETADIST(2, 8, 10, true, 1, 3)` | Giá trị, alpha, beta, cờ tích lũy, A (tùy chọn), B (tùy chọn). | 0.6854705810117458 |
| **BETAINV** | Trả về nghịch đảo của phân phối beta tích lũy. | `BETAINV(0.6854705810117458, 8, 10, 1, 3)` | Xác suất, alpha, beta, A (tùy chọn), B (tùy chọn). | 1.9999999999999998 |
| **BINOMDIST** | Trả về xác suất của phân phối nhị thức. | `BINOMDIST(6, 10, 0.5, false)` | Số lần thành công, số lần thử, xác suất thành công, cờ tích lũy. | 0.205078125 |
| **CORREL** | Trả về hệ số tương quan giữa hai tập dữ liệu. | `CORREL([3,2,4,5,6], [9,7,12,15,17])` | Hai mảng số. | 0.9970544855015815 |
| **COUNT** | Đếm các ô chứa số. | `COUNT([1,2], [3,4])` | Các mảng hoặc phạm vi số. | 4 |
| **COUNTA** | Đếm các ô không trống. | `COUNTA([1, null, 3, 'a', '', 'c'])` | Các mảng hoặc phạm vi thuộc bất kỳ kiểu nào. | 4 |
| **COUNTBLANK** | Đếm các ô trống. | `COUNTBLANK([1, null, 3, 'a', '', 'c'])` | Các mảng hoặc phạm vi thuộc bất kỳ kiểu nào. | 2 |
| **COUNTIF** | Đếm các ô khớp với một điều kiện. | `COUNTIF(['Caen', 'Melbourne', 'Palo Alto', 'Singapore'], 'a')` | Phạm vi số hoặc văn bản, và điều kiện. | 3 |
| **COUNTIFS** | Đếm các ô khớp với nhiều điều kiện. | `COUNTIFS([2,4,8,16], [1,2,3,4], '>=2', [1,2,4,8], '<=4')` | Các cặp phạm vi tiêu chí và biểu thức tiêu chí. | 2 |
| **COVARIANCEP** | Trả về hiệp phương sai tổng thể. | `COVARIANCEP([3,2,4,5,6], [9,7,12,15,17])` | Hai mảng số. | 5.2 |
| **COVARIANCES** | Trả về hiệp phương sai mẫu. | `COVARIANCES([2,4,8], [5,11,12])` | Hai mảng số. | 9.666666666666668 |
| **DEVSQ** | Trả về tổng bình phương các độ lệch. | `DEVSQ([2,4,8,16])` | Mảng số đại diện cho các điểm dữ liệu. | 115 |
| **EXPONDIST** | Trả về phân phối mũ. | `EXPONDIST(0.2, 10, true)` | Giá trị, lambda, cờ tích lũy. | 0.8646647167633873 |
| **FDIST** | Trả về phân phối xác suất F. | `FDIST(15.2069, 6, 4, false)` | Giá trị, bậc tự do 1, bậc tự do 2, cờ tích lũy. | 0.0012237917087831735 |
| **FINV** | Trả về nghịch đảo của phân phối F. | `FINV(0.01, 6, 4)` | Xác suất, bậc tự do 1, bậc tự do 2. | 0.10930991412457851 |
| **FISHER** | Trả về phép biến đổi Fisher. | `FISHER(0.75)` | Số đại diện cho hệ số tương quan. | 0.9729550745276566 |
| **FISHERINV** | Trả về nghịch đảo của phép biến đổi Fisher. | `FISHERINV(0.9729550745276566)` | Số đại diện cho kết quả biến đổi Fisher. | 0.75 |
| **FORECAST** | Dự đoán giá trị y cho một x nhất định bằng cách sử dụng các giá trị x và y đã biết. | `FORECAST(30, [6,7,9,15,21], [20,28,31,38,40])` | Giá trị x mới, mảng các giá trị y đã biết, mảng các giá trị x đã biết. | 10.607253086419755 |
| **FREQUENCY** | Trả về phân phối tần suất. | `FREQUENCY([79,85,78,85,50,81,95,88,97], [70,79,89])` | Mảng dữ liệu, mảng các khoảng (bins). | 1,2,4,2 |
| **GAMMA** | Trả về hàm gamma. | `GAMMA(2.5)` | Số dương. | 1.3293403919101043 |
| **GAMMALN** | Trả về logarit tự nhiên của hàm gamma. | `GAMMALN(10)` | Số dương. | 12.801827480081961 |
| **GAUSS** | Trả về xác suất dựa trên phân phối chuẩn tắc. | `GAUSS(2)` | Số đại diện cho điểm z (z-score). | 0.4772498680518208 |
| **GEOMEAN** | Trả về trung bình nhân. | `GEOMEAN([2,4], [8,16])` | Các mảng số. | 5.656854249492381 |
| **GROWTH** | Dự đoán các giá trị tăng trưởng lũy thừa dựa trên dữ liệu đã biết. | `GROWTH([2,4,8,16], [1,2,3,4], [5])` | Mảng các giá trị y đã biết, mảng các giá trị x đã biết, các giá trị x mới. | 32.00000000000003 |
| **HARMEAN** | Trả về trung bình điều hòa. | `HARMEAN([2,4], [8,16])` | Các mảng số. | 4.266666666666667 |
| **HYPGEOMDIST** | Trả về phân phối siêu bội. | `HYPGEOMDIST(1, 4, 8, 20, false)` | Số lần thành công trong mẫu, kích thước mẫu, số lần thành công trong tổng thể, kích thước tổng thể, cờ tích lũy. | 0.3632610939112487 |
| **INTERCEPT** | Trả về điểm cắt của đường hồi quy tuyến tính. | `INTERCEPT([2,3,9,1,8], [6,5,11,7,5])` | Mảng các giá trị y đã biết, mảng các giá trị x đã biết. | 0.04838709677419217 |
| **KURT** | Trả về độ nhọn. | `KURT([3,4,5,2,3,4,5,6,4,7])` | Mảng số. | -0.15179963720841627 |
| **LARGE** | Trả về giá trị lớn thứ k. | `LARGE([3,5,3,5,4,4,2,4,6,7], 3)` | Mảng số, k. | 5 |
| **LINEST** | Thực hiện phân tích hồi quy tuyến tính. | `LINEST([1,9,5,7], [0,4,2,3], true, true)` | Mảng các giá trị y đã biết, mảng các giá trị x đã biết, trả về thống kê bổ sung, trả về thêm thống kê. | 2,1 |
| **LOGNORMDIST** | Trả về phân phối log-chuẩn. | `LOGNORMDIST(4, 3.5, 1.2, true)` | Giá trị, trung bình, độ lệch chuẩn, cờ tích lũy. | 0.0390835557068005 |
| **LOGNORMINV** | Trả về nghịch đảo của phân phối log-chuẩn. | `LOGNORMINV(0.0390835557068005, 3.5, 1.2, true)` | Xác suất, trung bình, độ lệch chuẩn, cờ tích lũy. | 4.000000000000001 |
| **MAX** | Trả về giá trị lớn nhất. | `MAX([0.1,0.2], [0.4,0.8], [true, false])` | Các mảng số. | 0.8 |
| **MAXA** | Trả về giá trị lớn nhất bao gồm cả văn bản và giá trị logic. | `MAXA([0.1,0.2], [0.4,0.8], [true, false])` | Các mảng số, văn bản hoặc giá trị logic. | 1 |
| **MEDIAN** | Trả về số trung vị. | `MEDIAN([1,2,3], [4,5,6])` | Các mảng số. | 3.5 |
| **MIN** | Trả về giá trị nhỏ nhất. | `MIN([0.1,0.2], [0.4,0.8], [true, false])` | Các mảng số. | 0.1 |
| **MINA** | Trả về giá trị nhỏ nhất bao gồm cả văn bản và giá trị logic. | `MINA([0.1,0.2], [0.4,0.8], [true, false])` | Các mảng số, văn bản hoặc giá trị logic. | 0 |
| **MODEMULT** | Trả về một mảng các giá trị xuất hiện thường xuyên nhất. | `MODEMULT([1,2,3,4,3,2,1,2,3])` | Mảng số. | 2,3 |
| **MODESNGL** | Trả về giá trị đơn lẻ xuất hiện thường xuyên nhất. | `MODESNGL([1,2,3,4,3,2,1,2,3])` | Mảng số. | 2 |
| **NORMDIST** | Trả về phân phối chuẩn. | `NORMDIST(42, 40, 1.5, true)` | Giá trị, trung bình, độ lệch chuẩn, cờ tích lũy. | 0.9087887802741321 |
| **NORMINV** | Trả về nghịch đảo của phân phối chuẩn. | `NORMINV(0.9087887802741321, 40, 1.5)` | Xác suất, trung bình, độ lệch chuẩn. | 42 |
| **NORMSDIST** | Trả về phân phối chuẩn tắc. | `NORMSDIST(1, true)` | Số đại diện cho điểm z (z-score). | 0.8413447460685429 |
| **NORMSINV** | Trả về nghịch đảo của phân phối chuẩn tắc. | `NORMSINV(0.8413447460685429)` | Xác suất. | 1.0000000000000002 |
| **PEARSON** | Trả về hệ số tương quan moment tích Pearson. | `PEARSON([9,7,5,3,1], [10,6,1,5,3])` | Hai mảng số. | 0.6993786061802354 |
| **PERCENTILEEXC** | Trả về phân vị thứ k, loại trừ. | `PERCENTILEEXC([1,2,3,4], 0.3)` | Mảng số, k. | 1.5 |
| **PERCENTILEINC** | Trả về phân vị thứ k, bao gồm. | `PERCENTILEINC([1,2,3,4], 0.3)` | Mảng số, k. | 1.9 |
| **PERCENTRANKEXC** | Trả về thứ hạng của một giá trị trong tập dữ liệu dưới dạng phần trăm (loại trừ). | `PERCENTRANKEXC([1,2,3,4], 2, 2)` | Mảng số, giá trị x, độ chính xác (tùy chọn). | 0.4 |
| **PERCENTRANKINC** | Trả về thứ hạng của một giá trị trong tập dữ liệu dưới dạng phần trăm (bao gồm). | `PERCENTRANKINC([1,2,3,4], 2, 2)` | Mảng số, giá trị x, độ chính xác (tùy chọn). | 0.33 |
| **PERMUT** | Trả về số hoán vị. | `PERMUT(100, 3)` | Tổng số phần tử n, số phần tử được chọn k. | 970200 |
| **PERMUTATIONA** | Trả về số hoán vị có lặp lại. | `PERMUTATIONA(4, 3)` | Tổng số phần tử n, số phần tử được chọn k. | 64 |
| **PHI** | Trả về hàm mật độ của phân phối chuẩn tắc. | `PHI(0.75)` | Số đại diện cho điểm z (z-score). | 0.30113743215480443 |
| **POISSONDIST** | Trả về phân phối Poisson. | `POISSONDIST(2, 5, true)` | Số sự kiện, trung bình, cờ tích lũy. | 0.12465201948308113 |
| **PROB** | Trả về tổng các xác suất. | `PROB([1,2,3,4], [0.1,0.2,0.2,0.1], 2, 3)` | Mảng các giá trị, mảng các xác suất, giới hạn dưới, giới hạn trên. | 0.4 |
| **QUARTILEEXC** | Trả về tứ phân vị của tập dữ liệu, loại trừ. | `QUARTILEEXC([1,2,3,4], 1)` | Mảng số, tứ phân vị cần tính. | 1.25 |
| **QUARTILEINC** | Trả về tứ phân vị của tập dữ liệu, bao gồm. | `QUARTILEINC([1,2,3,4], 1)` | Mảng số, tứ phân vị cần tính. | 1.75 |
| **RANKAVG** | Trả về thứ hạng trung bình. | `RANKAVG(4, [2,4,4,8,8,16], false)` | Số, mảng số, thứ tự (tăng dần/giảm dần). | 4.5 |
| **RANKEQ** | Trả về thứ hạng của một số. | `RANKEQ(4, [2,4,4,8,8,16], false)` | Số, mảng số, thứ tự (tăng dần/giảm dần). | 4 |
| **RSQ** | Trả về hệ số xác định. | `RSQ([9,7,5,3,1], [10,6,1,5,3])` | Hai mảng số. | 0.4891304347826088 |
| **SKEW** | Trả về độ lệch. | `SKEW([3,4,5,2,3,4,5,6,4,7])` | Mảng số. | 0.3595430714067974 |
| **SKEWP** | Trả về độ lệch tổng thể. | `SKEWP([3,4,5,2,3,4,5,6,4,7])` | Mảng số. | 0.303193339354144 |
| **SLOPE** | Trả về hệ số góc của đường hồi quy tuyến tính. | `SLOPE([1,9,5,7], [0,4,2,3])` | Mảng các giá trị y đã biết, mảng các giá trị x đã biết. | 2 |
| **SMALL** | Trả về giá trị nhỏ thứ k. | `SMALL([3,5,3,5,4,4,2,4,6,7], 3)` | Mảng số, k. | 3 |
| **STANDARDIZE** | Trả về một giá trị chuẩn hóa dưới dạng điểm z. | `STANDARDIZE(42, 40, 1.5)` | Giá trị, trung bình, độ lệch chuẩn. | 1.3333333333333333 |
| **STDEVA** | Trả về độ lệch chuẩn, bao gồm cả văn bản và giá trị logic. | `STDEVA([2,4], [8,16], [true, false])` | Các mảng số, văn bản hoặc giá trị logic. | 6.013872850889572 |
| **STDEVP** | Trả về độ lệch chuẩn tổng thể. | `STDEVP([2,4], [8,16], [true, false])` | Các mảng số. | 5.361902647381804 |
| **STDEVPA** | Trả về độ lệch chuẩn tổng thể, bao gồm cả văn bản và giá trị logic. | `STDEVPA([2,4], [8,16], [true, false])` | Các mảng số, văn bản hoặc giá trị logic. | 5.489889697333535 |
| **STDEVS** | Trả về độ lệch chuẩn mẫu. | `VARS([2,4], [8,16], [true, false])` | Các mảng số. | 6.191391873668904 |
| **STEYX** | Trả về sai số chuẩn của giá trị y được dự đoán. | `STEYX([2,3,9,1,8,7,5], [6,5,11,7,5,4,4])` | Mảng các giá trị y đã biết, mảng các giá trị x đã biết. | 3.305718950210041 |
| **TINV** | Trả về nghịch đảo của phân phối t. | `TINV(0.9946953263673741, 1)` | Xác suất, bậc tự do. | 59.99999999996535 |
| **TRIMMEAN** | Trả về trung bình của phần bên trong của một tập dữ liệu. | `TRIMMEAN([4,5,6,7,2,3,4,5,1,2,3], 0.2)` | Mảng số, tỷ lệ cắt bỏ. | 3.7777777777777777 |
| **VARA** | Trả về phương sai bao gồm cả văn bản và giá trị logic. | `VARA([2,4], [8,16], [true, false])` | Các mảng số, văn bản hoặc giá trị logic. | 36.16666666666667 |
| **VARP** | Trả về phương sai tổng thể. | `VARP([2,4], [8,16], [true, false])` | Các mảng số. | 28.75 |
| **VARPA** | Trả về phương sai tổng thể bao gồm cả văn bản và giá trị logic. | `VARPA([2,4], [8,16], [true, false])` | Các mảng số, văn bản hoặc giá trị logic. | 30.13888888888889 |
| **VARS** | Trả về phương sai mẫu. | `VARS([2,4], [8,16], [true, false])` | Các mảng số. | 38.333333333333336 |
| **WEIBULLDIST** | Trả về phân phối Weibull. | `WEIBULLDIST(105, 20, 100, true)` | Giá trị, alpha, beta, cờ tích lũy. | 0.9295813900692769 |
| **ZTEST** | Trả về xác suất một đuôi của kiểm định z. | `ZTEST([3,6,7,8,6,5,4,2,1,9], 4)` | Mảng số, trung bình giả thuyết. | 0.09057419685136381 |

### Văn bản

| Hàm | Định nghĩa | Ví dụ gọi | Tham số | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **CHAR** | Chuyển đổi mã số thành ký tự tương ứng. | `CHAR(65)` | Số đại diện cho mã ký tự. | A |
| **CLEAN** | Loại bỏ tất cả các ký tự không in được khỏi văn bản. | `CLEAN('Monthly report')` | Chuỗi văn bản cần làm sạch. | Monthly report |
| **CODE** | Trả về mã số của ký tự đầu tiên trong chuỗi văn bản. | `CODE('A')` | Chuỗi văn bản chứa một ký tự duy nhất. | 65 |
| **CONCATENATE** | Nối nhiều chuỗi văn bản thành một chuỗi. | `CONCATENATE('Andreas', ' ', 'Hauser')` | Một hoặc nhiều chuỗi văn bản cần nối. | Andreas Hauser |
| **EXACT** | Kiểm tra xem hai chuỗi có hoàn toàn giống nhau hay không, có phân biệt chữ hoa chữ thường. | `EXACT('Word', 'word')` | Hai chuỗi văn bản cần so sánh. | |
| **FIND** | Tìm vị trí của một chuỗi con bắt đầu từ một vị trí nhất định. | `FIND('M', 'Miriam McGovern', 3)` | Văn bản cần tìm, văn bản nguồn, vị trí bắt đầu tùy chọn. | 8 |
| **LEFT** | Trả về một số lượng ký tự cụ thể từ phía bên trái của một chuỗi. | `LEFT('Sale Price', 4)` | Chuỗi văn bản và số lượng ký tự. | Sale |
| **LEN** | Trả về số lượng ký tự trong một chuỗi văn bản. | `LEN('Phoenix, AZ')` | Chuỗi văn bản cần đếm. | 11 |
| **LOWER** | Chuyển đổi tất cả các ký tự thành chữ thường. | `LOWER('E. E. Cummings')` | Chuỗi văn bản cần chuyển đổi. | e. e. cummings |
| **MID** | Trả về một số lượng ký tự cụ thể từ giữa một chuỗi. | `MID('Fluid Flow', 7, 20)` | Chuỗi văn bản, vị trí bắt đầu, số lượng ký tự. | Flow |
| **NUMBERVALUE** | Chuyển đổi văn bản thành số bằng cách sử dụng các dấu phân cách được chỉ định. | `NUMBERVALUE('2.500,27', ',', '.')` | Chuỗi văn bản, dấu phân cách thập phân, dấu phân cách nhóm. | 2500.27 |
| **PROPER** | Viết hoa chữ cái đầu tiên của mỗi từ. | `PROPER('this is a TITLE')` | Chuỗi văn bản cần định dạng. | This Is A Title |
| **REPLACE** | Thay thế một phần của chuỗi văn bản bằng văn bản mới. | `REPLACE('abcdefghijk', 6, 5, '*')` | Văn bản gốc, vị trí bắt đầu, số lượng ký tự, văn bản mới. | abcde*k |
| **REPT** | Lặp lại văn bản một số lần nhất định. | `REPT('*-', 3)` | Chuỗi văn bản và số lần lặp. | *-*-*- |
| **RIGHT** | Trả về một số lượng ký tự cụ thể từ phía bên phải của một chuỗi. | `RIGHT('Sale Price', 5)` | Chuỗi văn bản và số lượng ký tự. | Price |
| **ROMAN** | Chuyển đổi số Ả Rập sang số La Mã. | `ROMAN(499)` | Số Ả Rập cần chuyển đổi. | CDXCIX |
| **SEARCH** | Tìm vị trí của một chuỗi con, không phân biệt chữ hoa chữ thường. | `SEARCH('margin', 'Profit Margin')` | Văn bản cần tìm, văn bản nguồn. | 8 |
| **SUBSTITUTE** | Thay thế một trường hợp cụ thể của văn bản cũ bằng văn bản mới. | `SUBSTITUTE('Quarter 1, 2011', '1', '2', 3)` | Văn bản gốc, văn bản cũ, văn bản mới, số thứ tự trường hợp tùy chọn. | Quarter 1, 2012 |
| **T** | Trả về văn bản nếu giá trị là văn bản; ngược lại trả về một chuỗi trống. | `T('Rainfall')` | Đối số có thể là bất kỳ kiểu dữ liệu nào. | Rainfall |
| **TRIM** | Loại bỏ các khoảng trắng khỏi văn bản ngoại trừ các khoảng trắng đơn giữa các từ. | `TRIM(' First Quarter Earnings ')` | Chuỗi văn bản cần cắt tỉa. | First Quarter Earnings |
| **TEXTJOIN** | Nối nhiều mục văn bản thành một chuỗi bằng cách sử dụng dấu phân cách. | `TEXTJOIN(' ', true, 'The', '', 'sun', 'will', 'come', 'up', 'tomorrow.')` | Dấu phân cách, cờ bỏ qua ô trống, các mục văn bản cần nối. | The sun will come up tomorrow. |
| **UNICHAR** | Trả về ký tự cho một số Unicode nhất định. | `UNICHAR(66)` | Điểm mã Unicode. | B |
| **UNICODE** | Trả về số Unicode của ký tự đầu tiên trong văn bản. | `UNICODE('B')` | Chuỗi văn bản chứa một ký tự duy nhất. | 66 |
| **UPPER** | Chuyển đổi tất cả các ký tự thành chữ hoa. | `UPPER('total')` | Chuỗi văn bản cần chuyển đổi. | TOTAL |