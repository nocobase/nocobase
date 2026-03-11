---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/multi-app/multi-app/index).
:::

# Quản lý đa ứng dụng

## Tổng quan tính năng

Quản lý đa ứng dụng là giải pháp quản lý ứng dụng thống nhất do NocoBase cung cấp, được sử dụng để tạo và quản lý nhiều phiên bản ứng dụng NocoBase bị cô lập về mặt vật lý trong một hoặc nhiều môi trường chạy. Thông qua trình giám sát ứng dụng (AppSupervisor), người dùng có thể tạo và bảo trì nhiều ứng dụng từ một lối vào thống nhất, đáp ứng nhu cầu của các nghiệp vụ và giai đoạn quy mô khác nhau.

## Đơn ứng dụng

Trong giai đoạn đầu của dự án, hầu hết người dùng sẽ bắt đầu với một ứng dụng duy nhất.

Trong chế độ này, hệ thống chỉ cần triển khai một phiên bản NocoBase, tất cả các chức năng nghiệp vụ, dữ liệu và người dùng đều chạy trong cùng một ứng dụng. Việc triển khai đơn giản, chi phí cấu hình thấp, rất phù hợp để xác minh nguyên mẫu, các dự án nhỏ hoặc công cụ nội bộ.

Tuy nhiên, khi nghiệp vụ dần trở nên phức tạp, một ứng dụng duy nhất sẽ đối mặt với một số hạn chế tự nhiên:

- Các chức năng liên tục chồng chất, hệ thống trở nên cồng kềnh
- Khó khăn trong việc cô lập giữa các nghiệp vụ khác nhau
- Chi phí mở rộng và bảo trì ứng dụng tiếp tục tăng cao

Tại thời điểm này, người dùng sẽ muốn chia nhỏ các nghiệp vụ khác nhau thành nhiều ứng dụng để nâng cao khả năng bảo trì và mở rộng của hệ thống.

## Đa ứng dụng chia sẻ bộ nhớ

Khi người dùng muốn chia nhỏ nghiệp vụ nhưng không muốn áp dụng kiến trúc triển khai và vận hành phức tạp, họ có thể nâng cấp lên chế độ đa ứng dụng chia sẻ bộ nhớ.

Trong chế độ này, nhiều ứng dụng có thể chạy đồng thời trong một phiên bản NocoBase. Mỗi ứng dụng là độc lập, có thể kết nối với các cơ sở dữ liệu độc lập, có thể được tạo, khởi động và dừng riêng lẻ, nhưng chúng chia sẻ cùng một tiến trình và không gian bộ nhớ, người dùng vẫn chỉ cần bảo trì một phiên bản NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

Phương pháp này mang lại những cải tiến rõ rệt:

- Nghiệp vụ có thể được chia nhỏ theo chiều hướng ứng dụng
- Các chức năng và cấu hình giữa các ứng dụng trở nên rõ ràng hơn
- So với các giải pháp đa tiến trình hoặc đa container, mức tiêu thụ tài nguyên thấp hơn

Tuy nhiên, vì tất cả các ứng dụng chạy trong cùng một tiến trình, chúng sẽ chia sẻ các tài nguyên như CPU, bộ nhớ, v.v. Sự bất thường hoặc tải cao của một ứng dụng duy nhất có thể ảnh hưởng đến sự ổn định của các ứng dụng khác.

Khi số lượng ứng dụng tiếp tục tăng lên, hoặc khi có yêu cầu cao hơn về tính cô lập và ổn định, kiến trúc cần được nâng cấp thêm.

## Triển khai hỗn hợp đa môi trường

Khi quy mô và độ phức tạp của nghiệp vụ đạt đến một mức độ nhất định, và số lượng ứng dụng cần mở rộng theo quy mô, chế độ đa ứng dụng chia sẻ bộ nhớ sẽ đối mặt với các thách thức như tranh chấp tài nguyên, tính ổn định và bảo mật. Trong giai đoạn quy mô hóa, người dùng có thể cân nhắc áp dụng phương thức triển khai hỗn hợp đa môi trường để hỗ trợ các kịch bản nghiệp vụ phức tạp hơn.

Cốt lõi của kiến trúc này là giới thiệu một ứng dụng lối vào, tức là triển khai một NocoBase làm trung tâm quản lý thống nhất, đồng thời triển khai nhiều NocoBase làm môi trường chạy ứng dụng để thực sự vận hành các ứng dụng nghiệp vụ.

Ứng dụng lối vào chịu trách nhiệm:

- Tạo, cấu hình và quản lý vòng đời của ứng dụng
- Phân phối các lệnh quản lý và tổng hợp trạng thái

Môi trường ứng dụng phiên bản chịu trách nhiệm:

- Thực sự đảm nhận và vận hành các ứng dụng nghiệp vụ thông qua chế độ đa ứng dụng chia sẻ bộ nhớ

Đối với người dùng, nhiều ứng dụng vẫn có thể được tạo và quản lý thông qua một lối vào duy nhất, nhưng ở bên trong:

- Các ứng dụng khác nhau có thể chạy trên các nút hoặc cụm khác nhau
- Mỗi ứng dụng có thể sử dụng các cơ sở dữ liệu và middleware độc lập
- Có thể mở rộng quy mô hoặc cô lập các ứng dụng có tải cao theo nhu cầu

![](https://static-docs.nocobase.com/202512231215186.png)

Phương thức này phù hợp cho các nền tảng SaaS, số lượng lớn môi trường Demo hoặc các kịch bản đa khách thuê (multi-tenant), vừa đảm bảo tính linh hoạt, vừa nâng cao tính ổn định và khả năng vận hành của hệ thống.