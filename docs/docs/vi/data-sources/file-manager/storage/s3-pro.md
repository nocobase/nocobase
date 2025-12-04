---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Lưu trữ Tệp: S3 (Pro)

## Giới thiệu

Dựa trên plugin quản lý tệp, phiên bản này bổ sung hỗ trợ các loại lưu trữ tệp tương thích với giao thức S3. Bất kỳ dịch vụ lưu trữ đối tượng nào hỗ trợ giao thức S3 đều có thể dễ dàng tích hợp, chẳng hạn như Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, v.v., giúp nâng cao khả năng tương thích và tính linh hoạt của các dịch vụ lưu trữ.

## Tính năng nổi bật

1.  **Tải lên từ máy khách:** Quá trình tải tệp không cần thông qua máy chủ NocoBase mà kết nối trực tiếp với dịch vụ lưu trữ tệp, mang lại trải nghiệm tải lên hiệu quả và nhanh chóng hơn.
2.  **Truy cập riêng tư:** Khi truy cập tệp, tất cả các URL đều là địa chỉ ủy quyền tạm thời đã được ký, đảm bảo tính bảo mật và thời hạn của việc truy cập tệp.

## Trường hợp sử dụng

1.  **Quản lý bảng tệp:** Tập trung quản lý và lưu trữ tất cả các tệp đã tải lên, hỗ trợ nhiều loại tệp và phương thức lưu trữ khác nhau, thuận tiện cho việc phân loại và tìm kiếm tệp.
2.  **Lưu trữ trường đính kèm:** Dùng để lưu trữ dữ liệu đính kèm được tải lên thông qua biểu mẫu hoặc bản ghi, hỗ trợ liên kết với các bản ghi dữ liệu cụ thể.

## Cấu hình plugin

1.  Bật plugin `plugin-file-storage-s3-pro`.
2.  Truy cập "Cài đặt -> Quản lý Tệp" để vào phần cài đặt quản lý tệp.
3.  Nhấp vào nút "Thêm mới" và chọn "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  Trong cửa sổ bật lên, bạn sẽ thấy một biểu mẫu chi tiết cần điền. Vui lòng tham khảo tài liệu tiếp theo để lấy các thông số liên quan cho dịch vụ tệp của bạn và điền chính xác vào biểu mẫu.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Cấu hình nhà cung cấp dịch vụ

### Amazon S3

#### Tạo Bucket

1.  Truy cập [Bảng điều khiển Amazon S3](https://ap-southeast-1.console.aws.amazon.com/s3/home).
2.  Nhấp vào nút "Create bucket" ở phía bên phải.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3.  Điền `Bucket Name` (Tên Bucket), các trường khác có thể giữ nguyên cài đặt mặc định, cuộn xuống cuối trang và nhấp vào nút **"Create"** để hoàn tất quá trình tạo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Cấu hình CORS

1.  Trong danh sách các bucket, tìm và nhấp vào bucket vừa tạo để truy cập trang chi tiết của nó.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  Chuyển đến tab "Permission" và cuộn xuống phần cấu hình CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  Nhập cấu hình sau (có thể tùy chỉnh nếu cần) và lưu lại.

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Lấy AccessKey và SecretAccessKey

1.  Nhấp vào nút "Security credentials" ở góc trên bên phải.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  Cuộn xuống phần "Access Keys" và nhấp vào "Create Access Key."

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  Đồng ý với các điều khoản (khuyến nghị sử dụng IAM cho môi trường sản xuất).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  Lưu lại Access Key và Secret Access Key được hiển thị.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Lấy và cấu hình tham số

1.  `AccessKey ID` và `AccessKey Secret` là các giá trị bạn đã lấy được ở bước trước, vui lòng điền chính xác.
2.  Truy cập bảng thuộc tính của bucket để tìm `Bucket Name` và `Region` (Khu vực).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Truy cập công khai (Tùy chọn)

Đây là cấu hình không bắt buộc. Hãy cấu hình khi bạn cần làm cho các tệp đã tải lên hoàn toàn công khai.

1.  Trong bảng Permissions, cuộn xuống "Object Ownership", nhấp vào "Edit", và bật ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  Cuộn xuống "Block public access", nhấp vào "Edit", và đặt thành cho phép kiểm soát ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  Chọn "Public access" trong NocoBase.

#### Cấu hình hình thu nhỏ (Tùy chọn)

Cấu hình này là tùy chọn và nên được sử dụng khi bạn cần tối ưu hóa kích thước hoặc hiệu ứng xem trước hình ảnh. **Xin lưu ý, việc triển khai này có thể phát sinh thêm chi phí. Để biết thêm chi tiết, vui lòng tham khảo các điều khoản và giá của AWS.**

1.  Truy cập [Chuyển đổi hình ảnh động cho Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2.  Nhấp vào nút `Launch in the AWS Console` ở cuối trang để bắt đầu triển khai.

![](https://static-docs.nocobase.com/20250221164214117.png)

3.  Làm theo hướng dẫn để hoàn tất cấu hình. Các tùy chọn sau đây cần được đặc biệt chú ý:
    1.  Khi tạo stack, bạn cần chỉ định tên bucket Amazon S3 chứa các hình ảnh nguồn. Vui lòng nhập tên bucket bạn đã tạo trước đó.
    2.  Nếu bạn chọn triển khai giao diện người dùng demo, sau khi triển khai, bạn có thể sử dụng giao diện người dùng đó để kiểm tra chức năng xử lý hình ảnh. Trong bảng điều khiển AWS CloudFormation, chọn stack của bạn, chuyển đến tab "Outputs", tìm giá trị tương ứng với khóa `DemoUrl`, và nhấp vào liên kết để mở giao diện demo.
    3.  Giải pháp này sử dụng thư viện Node.js `sharp` để xử lý hình ảnh hiệu quả. Bạn có thể tải mã nguồn từ kho GitHub và tùy chỉnh theo nhu cầu.

![](https://static-docs.nocobase.com/20250221164315472.png)

![](https://static-docs.nocobase.com/20250221164404755.png)

4.  Sau khi cấu hình hoàn tất, đợi trạng thái triển khai chuyển sang `CREATE_COMPLETE`.

5.  Trong cấu hình NocoBase, vui lòng lưu ý những điều sau:
    1.  `Thumbnail rule`: Điền các tham số xử lý hình ảnh, ví dụ: `?width=100`. Để biết chi tiết, tham khảo [tài liệu AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
    2.  `Access endpoint`: Nhập giá trị từ Outputs -> ApiEndpoint sau khi triển khai.
    3.  `Full access URL style`: Chọn **Ignore** (vì tên bucket đã được điền trong cấu hình, nên không cần thiết khi truy cập).

![](https://static-docs.nocobase.com/20250414152135514.png)

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Tạo Bucket

1.  Mở [Bảng điều khiển OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  Chọn "Buckets" từ menu bên trái và nhấp vào "Create Bucket" để bắt đầu tạo bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  Điền thông tin chi tiết về bucket và nhấp vào "Create".
    1.  `Bucket Name`: Chọn tên phù hợp với nhu cầu kinh doanh của bạn.
    2.  `Region`: Chọn khu vực gần nhất với người dùng của bạn.
    3.  Các cài đặt khác có thể giữ nguyên mặc định hoặc tùy chỉnh theo nhu cầu.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Cấu hình CORS

1.  Truy cập trang chi tiết của bucket bạn vừa tạo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  Nhấp vào "Content Security -> CORS" trong menu giữa.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  Nhấp vào nút "Create Rule", điền các trường liên quan, cuộn xuống và nhấp "OK". Bạn có thể tham khảo ảnh chụp màn hình bên dưới hoặc cấu hình chi tiết hơn.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Lấy AccessKey và SecretAccessKey

1.  Nhấp vào "AccessKey" dưới ảnh đại diện tài khoản của bạn ở góc trên bên phải.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  Để tiện minh họa, chúng tôi sẽ tạo AccessKey bằng tài khoản chính. Trong môi trường sản xuất, khuyến nghị sử dụng RAM để tạo AccessKey. Để biết hướng dẫn, vui lòng tham khảo [tài liệu Alibaba Cloud](https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp).
3.  Nhấp vào nút "Create AccessKey".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  Hoàn tất xác minh tài khoản.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  Lưu lại Access Key và Secret Access Key được hiển thị.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Lấy và cấu hình tham số

1.  `AccessKey ID` và `AccessKey Secret` là các giá trị lấy được ở bước trước.
2.  Truy cập trang chi tiết bucket để lấy tên `Bucket`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  Cuộn xuống để lấy `Region` (không cần phần ".aliyuncs.com" phía sau).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  Lấy địa chỉ endpoint và thêm tiền tố `https://` khi điền vào NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Cấu hình hình thu nhỏ (Tùy chọn)

Cấu hình này là tùy chọn và chỉ nên được sử dụng khi tối ưu hóa kích thước hoặc hiệu ứng xem trước hình ảnh.

1.  Điền các tham số liên quan cho `Thumbnail rule`. Để biết cài đặt tham số cụ thể, tham khảo tài liệu Alibaba Cloud về [Xử lý hình ảnh](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2.  Giữ cài đặt `Full upload URL style` và `Full access URL style` giống nhau.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Tạo Bucket

1.  Nhấp vào menu **Buckets** ở bên trái -> Nhấp vào **Create Bucket** để mở trang tạo.
2.  Điền tên Bucket, sau đó nhấp vào nút **Save**.

#### Lấy AccessKey và SecretAccessKey

1.  Truy cập **Access Keys** -> Nhấp vào nút **Create access key** để mở trang tạo.

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  Nhấp vào nút **Save**.

![](https://static-docs.nocobase.com/20250106111850639.png)

3.  Lưu lại **Access Key** và **Secret Key** từ cửa sổ bật lên để cấu hình sau này.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Cấu hình tham số

1.  Truy cập trang **Quản lý tệp** trong NocoBase.

2.  Nhấp vào nút **Thêm mới** và chọn **S3 Pro**.

3.  Điền vào biểu mẫu:
    *   **AccessKey ID** và **AccessKey Secret**: Sử dụng các giá trị đã lưu từ bước trước.
    *   **Region**: MinIO được triển khai riêng không có khái niệm khu vực; bạn có thể đặt là `"auto"`.
    *   **Endpoint**: Nhập tên miền hoặc địa chỉ IP của dịch vụ đã triển khai của bạn.
    *   Cần đặt `Full access URL style` thành `Path-Style`.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Bạn có thể tham khảo cấu hình cho các dịch vụ tệp ở trên. Logic tương tự.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Bạn có thể tham khảo cấu hình cho các dịch vụ tệp ở trên. Logic tương tự.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414154500264.png)

## Hướng dẫn sử dụng

Tham khảo tài liệu [plugin quản lý tệp](/data-sources/file-manager/).