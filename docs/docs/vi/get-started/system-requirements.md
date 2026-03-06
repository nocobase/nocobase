:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/get-started/system-requirements).
:::

# Yêu cầu hệ thống

Các yêu cầu hệ thống được mô tả trong tài liệu này là yêu cầu vận hành của **bản thân dịch vụ ứng dụng NocoBase**, chỉ bao gồm các tài nguyên tính toán và bộ nhớ cần thiết cho các tiến trình ứng dụng. **Không bao gồm các dịch vụ bên thứ ba phụ thuộc**, bao gồm nhưng không giới hạn ở:

- API Gateway / Reverse Proxy
- Dịch vụ cơ sở dữ liệu (như MySQL, PostgreSQL)
- Dịch vụ bộ nhớ đệm (như Redis)
- Middleware như hàng đợi tin nhắn (message queue), lưu trữ đối tượng (object storage), v.v.

Ngoại trừ các kịch bản chỉ dùng để xác thực tính năng hoặc thử nghiệm, **khuyến nghị mạnh mẽ nên triển khai các dịch vụ bên thứ ba nêu trên một cách độc lập** trên các máy chủ hoặc container riêng biệt, hoặc sử dụng trực tiếp các dịch vụ đám mây tương ứng.

Cấu hình hệ thống và lập kế hoạch dung lượng cho các dịch vụ liên quan nên được đánh giá và điều chỉnh riêng biệt dựa trên **lượng dữ liệu thực tế, tải trọng nghiệp vụ và quy mô truy cập đồng thời**.

## Chế độ triển khai đơn nút

Chế độ triển khai đơn nút nghĩa là dịch vụ ứng dụng NocoBase chỉ chạy trên một máy chủ hoặc một thực thể container duy nhất.

### Yêu cầu phần cứng tối thiểu

| Tài nguyên | Yêu cầu |
|---|---|
| CPU | 1 nhân |
| Bộ nhớ | 2 GB |

**Kịch bản áp dụng**:

- Doanh nghiệp siêu nhỏ
- Xác thực tính năng (POC)
- Môi trường phát triển / thử nghiệm
- Các kịch bản hầu như không có truy cập đồng thời

:::info{title=Gợi ý}

- Cấu hình này chỉ đảm bảo hệ thống có thể chạy được, không đảm bảo trải nghiệm hiệu suất.
- Khi lượng dữ liệu hoặc yêu cầu đồng thời tăng lên, tài nguyên hệ thống có thể nhanh chóng trở thành nút thắt cổ chai.
- Đối với các kịch bản **phát triển mã nguồn, phát triển plugin hoặc xây dựng và triển khai từ mã nguồn**, khuyến nghị dự phòng **ít nhất 4 GB bộ nhớ trống** để đảm bảo quá trình cài đặt phụ thuộc, biên dịch và xây dựng hoàn tất suôn sẻ.

:::

### Yêu cầu phần cứng khuyến nghị

| Tài nguyên | Cấu hình khuyến nghị |
|---|---|
| CPU | 2 nhân |
| Bộ nhớ | ≥ 4 GB |

**Kịch bản áp dụng**:

Phù hợp cho các nghiệp vụ vừa và nhỏ và môi trường sản xuất có lượng truy cập đồng thời thấp.

:::info{title=Gợi ý}

- Với cấu hình này, hệ thống có thể đáp ứng các thao tác quản trị thông thường và tải trọng nghiệp vụ nhẹ.
- Khi độ phức tạp của nghiệp vụ, truy cập đồng thời hoặc các tác vụ nền tăng lên, nên cân nhắc nâng cấp cấu hình phần cứng hoặc chuyển sang chế độ cụm.

:::

## Chế độ cụm

Phù hợp với các kịch bản nghiệp vụ quy mô trung bình đến lớn và có nhiều truy cập đồng thời, có thể mở rộng theo chiều ngang để nâng cao tính khả dụng và thông lượng của hệ thống (chi tiết vui lòng tham khảo: [Chế độ cụm](/cluster-mode)).

### Yêu cầu phần cứng cho mỗi nút

Trong chế độ cụm, cấu hình phần cứng khuyến nghị cho mỗi nút ứng dụng (Pod / thực thể) tương đương với chế độ triển khai đơn nút.

**Cấu hình tối thiểu mỗi nút:**

- CPU: 1 nhân
- Bộ nhớ: 2 GB

**Cấu hình khuyến nghị mỗi nút:**

- CPU: 2 nhân
- Bộ nhớ: 4 GB

### Lập kế hoạch số lượng nút

- Số lượng nút trong cụm có thể mở rộng theo nhu cầu (2–N)
- Số lượng nút thực tế cần thiết phụ thuộc vào:
  - Lượng truy cập đồng thời
  - Độ phức tạp của logic nghiệp vụ
  - Tải trọng của các tác vụ nền và xử lý bất đồng bộ
  - Khả năng phản hồi của các dịch vụ phụ thuộc bên ngoài

Khuyến nghị trong môi trường sản xuất:

- Kết hợp các chỉ số giám sát (CPU, bộ nhớ, độ trễ yêu cầu, v.v.) để điều chỉnh quy mô nút một cách linh hoạt.
- Dự phòng một lượng tài nguyên nhất định để ứng phó với các biến động lưu lượng.