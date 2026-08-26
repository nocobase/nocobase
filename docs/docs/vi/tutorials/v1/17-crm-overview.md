# Tổng quan tính năng CRM Sales Cloud

Trong chương này, chúng ta sẽ chia hệ thống thành nhiều module theo chức năng nghiệp vụ, mô tả chi tiết các chức năng cốt lõi của từng module và cấu trúc dữ liệu tương ứng. Toàn bộ giải pháp không chỉ chú trọng đến sự thông suốt của quy trình nghiệp vụ mà còn xem xét đầy đủ tính hợp lý của lưu trữ dữ liệu và khả năng mở rộng của hệ thống.

---

## 1. Quản lý Lead

### Tổng quan chức năng

Module quản lý Lead chịu trách nhiệm thu thập và quản lý thông tin Khách hàng tiềm năng. Hệ thống hỗ trợ nhập Lead qua nhiều kênh như website, điện thoại, email, đồng thời cung cấp các chức năng cập nhật trạng thái, ghi chú theo dõi và bình luận. Khi chuyển đổi Lead, hệ thống sẽ tự động phát hiện dữ liệu trùng lặp, đảm bảo chuyển đổi Lead phù hợp thành Khách hàng, Liên hệ và Cơ hội.

### Bảng dữ liệu liên quan

- **Leads (Bảng Lead)**
  Lưu trữ thông tin cơ bản của Lead như họ tên, thông tin liên hệ, nguồn, trạng thái hiện tại và ghi chú. Ghi lại thời gian tạo và nhật ký cập nhật của mỗi Lead, thuận tiện cho thống kê và phân tích sau này.

---

## 2. Quản lý Khách hàng và Liên hệ

### Tổng quan chức năng

Module này nhằm giúp người dùng xây dựng và duy trì hồ sơ Khách hàng. Doanh nghiệp có thể ghi lại tên công ty, ngành nghề, địa chỉ và các thông tin quan trọng khác của Khách hàng, đồng thời quản lý thông tin Liên hệ liên quan đến Khách hàng (như họ tên, chức vụ, điện thoại và email). Hệ thống hỗ trợ liên kết một-nhiều hoặc nhiều-nhiều giữa Khách hàng và Liên hệ, đảm bảo tính đầy đủ và đồng bộ của thông tin.

### Bảng dữ liệu liên quan

- **Accounts (Bảng Khách hàng)**
  Ghi lại hồ sơ chi tiết của Khách hàng, bao gồm thông tin cơ bản của công ty và các dữ liệu liên quan đến nghiệp vụ khác.
- **Contacts (Bảng Liên hệ)**
  Lưu trữ thông tin cá nhân liên quan đến Khách hàng và liên kết với bảng Khách hàng thông qua khóa ngoại, đảm bảo tính nhất quán của dữ liệu.

### Sơ đồ quy trình chuyển đổi Lead

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

- Nhập Lead → Theo dõi Lead (cập nhật trạng thái) → Xác minh Lead → Chuyển đổi thành Khách hàng, Liên hệ và Cơ hội

---

## 3. Quản lý Cơ hội

### Tổng quan chức năng

Module quản lý Cơ hội tập trung vào việc tạo cơ hội bán hàng từ Lead đã chuyển đổi hoặc thông tin Khách hàng hiện có. Người dùng có thể ghi lại ngày dự kiến chốt giao dịch, giai đoạn hiện tại, số tiền dự kiến và xác suất thành công của Cơ hội. Đồng thời, hệ thống hỗ trợ quản lý động các giai đoạn bán hàng và ghi lại chi tiết lý do khi Cơ hội thất bại, thuận tiện cho việc tối ưu hóa chiến lược bán hàng sau này. Ngoài ra, module cho phép liên kết nhiều sản phẩm với một Cơ hội duy nhất, tự động tính tổng số tiền.

### Bảng dữ liệu liên quan

- **Opportunities (Bảng Cơ hội)**
  Ghi lại thông tin chi tiết của mỗi cơ hội bán hàng, như ngày chốt giao dịch, giai đoạn bán hàng và số tiền dự kiến.
- **OpportunityLineItem (Bảng chi tiết Cơ hội)**
  Lưu trữ thông tin sản phẩm cụ thể liên kết với Cơ hội, bao gồm ID sản phẩm, số lượng, đơn giá và chiết khấu, hỗ trợ tự động tính số tiền.

### Các bước chuyển đổi

- Tạo Cơ hội → Quản lý cơ hội (cập nhật giai đoạn) → Tạo báo giá → Khách hàng phê duyệt → Tạo đơn hàng bán → Thực hiện đơn hàng và cập nhật trạng thái

---

## 4. Quản lý Sản phẩm và Bảng giá

### Tổng quan chức năng

Module này chịu trách nhiệm quản lý thông tin sản phẩm và chiến lược định giá. Hệ thống có thể nhập thông tin cơ bản của sản phẩm như mã sản phẩm, tên, mô tả, tồn kho và giá, đồng thời hỗ trợ thiết lập nhiều mô hình giá. Bằng cách liên kết sản phẩm với bảng giá, người dùng có thể quản lý linh hoạt nhu cầu định giá cho các thị trường và nhóm Khách hàng khác nhau.

### Bảng dữ liệu liên quan

- **Products (Bảng Sản phẩm)**
  Lưu trữ thông tin chi tiết của tất cả sản phẩm, cung cấp dữ liệu cơ bản cho việc tạo báo giá và đơn hàng.
- **PriceBooks (Bảng giá)**
  Quản lý các mô hình giá khác nhau và sản phẩm liên quan, hỗ trợ điều chỉnh chiến lược định giá theo nhu cầu nghiệp vụ.

---

## 5. Quản lý Báo giá

### Tổng quan chức năng

Module quản lý Báo giá tạo ra các báo giá chính thức từ Cơ hội hiện có, ghi lại thời hạn hiệu lực, chiết khấu, thuế suất và tổng số tiền của báo giá. Hệ thống tích hợp quy trình phê duyệt, cho phép cấp quản lý xem xét và điều chỉnh báo giá, mỗi báo giá còn có thể chứa nhiều chi tiết sản phẩm, đảm bảo tính chính xác trong tính toán dữ liệu.

### Bảng dữ liệu liên quan

- **Quotes (Bảng Báo giá)**
  Ghi lại thông tin cơ bản của báo giá, bao gồm Cơ hội liên kết, thời hạn hiệu lực, chiết khấu, thuế suất và trạng thái tổng thể.
- **QuoteLineItems (Bảng chi tiết Báo giá)**
  Lưu trữ dữ liệu chi tiết của từng sản phẩm trong báo giá, tự động tính số tiền của từng sản phẩm và tổng báo giá.

---

## 6. Quản lý Đơn hàng bán

### Tổng quan chức năng

Module quản lý Đơn hàng bán chuyển đổi báo giá đã được phê duyệt thành đơn hàng bán và theo dõi toàn bộ quá trình từ tạo đến hoàn thành đơn hàng. Người dùng có thể xem trạng thái đơn hàng, hồ sơ phê duyệt, tình trạng vận chuyển và giao hàng theo thời gian thực, từ đó kiểm soát tốt hơn tiến độ thực hiện đơn hàng.

### Bảng dữ liệu liên quan

- **SalesOrders (Bảng Đơn hàng bán)**
  Ghi lại thông tin chi tiết của đơn hàng, bao gồm báo giá liên kết, trạng thái đơn hàng, hồ sơ phê duyệt, trạng thái giao hàng và thời gian tạo đơn hàng.

---

## 7. Quản lý Hoạt động

### Tổng quan chức năng

Module quản lý Hoạt động giúp đội ngũ bán hàng quản lý các sắp xếp công việc hàng ngày, bao gồm nhiệm vụ, cuộc họp và liên lạc qua điện thoại. Hệ thống cho phép ghi lại nội dung cụ thể, người tham gia và ghi chú liên quan của hoạt động, đồng thời cung cấp các chức năng lập lịch và nhắc nhở, đảm bảo tất cả hoạt động được tiến hành thuận lợi theo kế hoạch.

### Bảng dữ liệu liên quan

- **Activities (Bảng Ghi chép Hoạt động)**
  Lưu trữ ghi chép nhiệm vụ, cuộc họp và cuộc gọi, bao gồm loại hoạt động, ngày tháng, người tham gia và thông tin Khách hàng hoặc Cơ hội liên quan.

---

## 8. Báo cáo và Phân tích Dữ liệu

### Tổng quan chức năng

Module này thông qua thống kê dữ liệu đa chiều và biểu đồ trực quan, giúp doanh nghiệp nắm bắt thực tế hiệu suất bán hàng và tình hình chuyển đổi nghiệp vụ theo thời gian thực. Hệ thống hỗ trợ tạo phễu bán hàng, phân tích tỷ lệ chuyển đổi và báo cáo hiệu suất, cung cấp hỗ trợ ra quyết định cho cấp quản lý.

### Giải thích

Mặc dù Báo cáo và Phân tích Dữ liệu không có bảng dữ liệu riêng, nhưng chúng phụ thuộc vào dữ liệu được lưu trữ trong các module đã đề cập, thông qua tổng hợp và phân tích dữ liệu để đạt được phản hồi thời gian thực và dự đoán xu hướng.

---

## 9. Quản lý Chiến dịch Marketing (Module tùy chọn)

### Tổng quan chức năng

Là chức năng bổ trợ, module quản lý Chiến dịch Marketing chủ yếu được sử dụng để lập kế hoạch và theo dõi các hoạt động marketing. Hệ thống có thể ghi lại quá trình lập kế hoạch, ngân sách, thực hiện và đánh giá hiệu quả của chiến dịch, thống kê tỷ lệ chuyển đổi Lead và tỷ suất hoàn vốn (ROI), cung cấp hỗ trợ dữ liệu cho việc xúc tiến marketing.

### Giải thích

Cấu trúc dữ liệu của module này có thể được mở rộng theo nhu cầu thực tế, hiện tại chủ yếu ghi lại tình hình thực hiện các hoạt động marketing và bổ sung cho dữ liệu của module quản lý Lead.
