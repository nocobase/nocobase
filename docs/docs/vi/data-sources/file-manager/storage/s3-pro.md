---
title: "Lưu trữ tệp: S3 (Pro)"
description: "Công cụ lưu trữ S3 Pro, bộ lưu trữ cấp doanh nghiệp tương thích với giao thức S3, hỗ trợ Endpoint tùy chỉnh và cấu hình nâng cao."
keywords: "S3 Pro,lưu trữ đối tượng,lưu trữ đám mây,tương thích S3,NocoBase"
---

# Lưu trữ tệp: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Giới thiệu

Trên cơ sở plugin quản lý tệp, bổ sung loại lưu trữ tệp tương thích với giao thức S3. Mọi dịch vụ lưu trữ đối tượng hỗ trợ giao thức S3 đều có thể dễ dàng tích hợp, chẳng hạn như Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, v.v., giúp nâng cao hơn nữa tính tương thích và linh hoạt của dịch vụ lưu trữ.

## Đặc điểm tính năng

1. Tải lên từ phía máy khách: Quá trình tải tệp lên không cần đi qua máy chủ NocoBase mà kết nối trực tiếp với dịch vụ lưu trữ tệp, mang lại trải nghiệm tải lên hiệu quả và nhanh chóng hơn.

2. Truy cập riêng tư: Khi truy cập tệp, tất cả URL đều là địa chỉ ủy quyền tạm thời đã được ký, đảm bảo tính bảo mật và thời hạn hiệu lực của việc truy cập tệp.


## Trường hợp sử dụng

1. **Quản lý bảng tệp**: Tập trung quản lý và lưu trữ tất cả tệp đã tải lên, hỗ trợ nhiều loại tệp và phương thức lưu trữ, thuận tiện cho việc phân loại và tìm kiếm tệp.

2. **Lưu trữ trường tệp đính kèm**: Dùng để lưu trữ dữ liệu tệp đính kèm được tải lên trong biểu mẫu hoặc bản ghi, hỗ trợ liên kết với các bản ghi dữ liệu cụ thể.


## Cấu hình plugin

1. Bật plugin plugin-file-storage-s3-pro

2. Nhấp vào "Setting-> FileManager" để vào phần cài đặt quản lý tệp

3. Nhấp vào nút "Add new", chọn "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Sau khi lớp nổi xuất hiện, bạn sẽ thấy biểu mẫu cần điền có khá nhiều nội dung. Bạn có thể tham khảo tài liệu bên dưới để lấy thông tin tham số tương ứng của dịch vụ tệp và điền chính xác vào biểu mẫu.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Cấu hình nhà cung cấp dịch vụ

### Amazon S3

#### Tạo Bucket

1. Mở https://ap-southeast-1.console.aws.amazon.com/s3/home để vào bảng điều khiển S3

2. Nhấp vào nút "Create bucket" ở bên phải

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Nhập Bucket Name (tên bucket), các trường khác có thể giữ nguyên cài đặt mặc định, cuộn xuống cuối trang và nhấp vào nút **"**Create**"** để hoàn tất việc tạo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Cấu hình CORS

1. Vào danh sách buckets, tìm và nhấp vào Bucket vừa tạo để vào trang chi tiết

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Nhấp vào tab "Permission", sau đó cuộn xuống để tìm phần cấu hình CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Nhập cấu hình sau (có thể tinh chỉnh cấu hình theo nhu cầu), sau đó lưu

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

1. Nhấp vào nút "Security credentials" ở góc trên bên phải trang

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Cuộn xuống, tìm phần "Access Keys" và nhấp vào nút "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Nhấp vào Đồng ý (ở đây minh họa bằng tài khoản chính; trong môi trường chính thức, khuyến nghị sử dụng IAM để thực hiện).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Lưu Access key và Secret access key hiển thị trên trang

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Lấy và cấu hình tham số

1. AccessKey ID và AccessKey Secret là các giá trị tương ứng lấy được ở bước trước, hãy điền chính xác

2. Vào bảng properties của trang chi tiết bucket, bạn có thể lấy thông tin Bucket và Region (khu vực).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Truy cập công khai (tùy chọn)

Đây là cấu hình không bắt buộc, chỉ thực hiện khi bạn cần công khai hoàn toàn các tệp đã tải lên

1. Vào bảng Permissions, cuộn xuống Object Ownership, nhấp vào chỉnh sửa và bật ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Cuộn xuống Block public access, nhấp vào chỉnh sửa và thiết lập cho phép ACLs kiểm soát

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Trong NocoBase, chọn Public access


#### Cấu hình hình thu nhỏ (tùy chọn)

Đây là cấu hình tùy chọn, dùng khi cần tối ưu kích thước hoặc hiệu ứng xem trước hình ảnh. **Lưu ý rằng phương án triển khai này có thể phát sinh chi phí bổ sung; vui lòng tham khảo các điều khoản liên quan của AWS để biết chi phí cụ thể.**

1. Truy cập [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Nhấp vào nút `Launch in the AWS Console` ở cuối trang để bắt đầu triển khai phương án.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Làm theo hướng dẫn để hoàn tất cấu hình. Cần đặc biệt chú ý đến các tùy chọn sau:
   1. Khi tạo stack, bạn cần chỉ định tên bucket Amazon S3 chứa hình ảnh nguồn. Vui lòng nhập tên bucket đã tạo trước đó.
   2. Nếu chọn triển khai giao diện người dùng demo, sau khi triển khai hoàn tất, bạn có thể kiểm tra chức năng xử lý hình ảnh thông qua giao diện này. Trong bảng điều khiển AWS CloudFormation, chọn stack của bạn, chuyển đến tab “Outputs”, tìm giá trị tương ứng với khóa DemoUrl và nhấp vào liên kết đó để mở giao diện demo.
   3. Phương án này sử dụng thư viện `sharp` Node.js để xử lý hình ảnh hiệu quả. Bạn có thể tải mã nguồn từ kho GitHub và tùy chỉnh theo nhu cầu.

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Sau khi hoàn tất cấu hình, hãy chờ trạng thái triển khai chuyển thành `CREATE_COMPLETE`.

5. Trong cấu hình NocoBase, cần lưu ý các điểm sau:
   1. `Thumbnail rule`: Điền các tham số liên quan đến xử lý hình ảnh, chẳng hạn như `?width=100`. Tham khảo [tài liệu AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) để biết thêm chi tiết.
   2. `Access endpoint`: Điền giá trị của Outputs -> ApiEndpoint sau khi triển khai.
   3. `Full access URL style`: Chọn **Ignore** (vì tên bucket đã được điền khi cấu hình nên không cần thêm khi truy cập).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Tạo Bucket

1. Mở bảng điều khiển OSS https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Vào menu "Buckets" ở bên trái, sau đó nhấp vào nút "Create Bucket" để bắt đầu tạo bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Nhập thông tin liên quan đến bucket, cuối cùng nhấp vào nút Create

    1. Bucket Name phù hợp với nghiệp vụ của bạn, tên tùy ý

    2. Region chọn khu vực gần người dùng của bạn nhất

    3. Các nội dung khác có thể giữ mặc định hoặc tự cấu hình theo nhu cầu

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Cấu hình CORS

1. Vào trang chi tiết của bucket đã tạo ở bước trước

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Nhấp vào "Content Security -> CORS" trong menu ở giữa

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Nhấp vào nút "Create Rule", điền các nội dung liên quan, cuộn xuống dưới và nhấp vào "OK". Bạn có thể tham khảo ảnh chụp màn hình bên dưới hoặc thực hiện các cài đặt chi tiết hơn

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Lấy AccessKey và SecretAccessKey

1. Nhấp vào "AccessKey" bên dưới ảnh đại diện ở góc trên bên phải

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Để thuận tiện minh họa, ở đây sử dụng tài khoản chính để tạo AccessKey; trong môi trường chính thức, khuyến nghị sử dụng RAM để tạo, có thể tham khảo https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp

3. Nhấp vào nút "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Thực hiện xác minh tài khoản

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Lưu Access key và Secret access key hiển thị trên trang

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Lấy và cấu hình tham số

1. AccessKey ID và AccessKey Secret là các giá trị lấy được ở bước trước

2. Vào trang chi tiết bucket để lấy Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Cuộn xuống để lấy Region (không cần phần ".aliyuncs.com" phía sau)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Lấy địa chỉ endpoint; khi điền vào NocoBase cần thêm tiền tố https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Cấu hình hình thu nhỏ (tùy chọn)

Đây là cấu hình tùy chọn, chỉ sử dụng khi cần tối ưu kích thước hoặc hiệu ứng xem trước hình ảnh.

1. Điền các tham số liên quan đến `Thumbnail rule`. Tham khảo [các tham số xử lý hình ảnh](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1) để biết cài đặt cụ thể.

2. `Full upload URL style` và `Full access URL style` chỉ cần giữ giống nhau.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Tạo Bucket

1. Nhấp vào menu Buckets ở bên trái -> nhấp vào Create Bucket để vào trang tạo
2. Nhập tên Bucket, sau đó nhấp vào nút lưu
#### Lấy AccessKey và SecretAccessKey

1. Vào Access Keys -> nhấp vào nút Create access key để vào trang tạo

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Nhấp vào nút lưu

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Lưu Access Key và Secret Key trong cửa sổ bật lên để sử dụng cho cấu hình sau

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Cấu hình tham số

1. Vào trang NocoBase -> File manager

2. Nhấp vào nút Add new, chọn S3 Pro

3. Điền biểu mẫu
   - **AccessKey ID** và **AccessKey Secret** là các giá trị đã lưu ở bước trước
   - **Region**: MinIO triển khai riêng không có khái niệm Region, có thể cấu hình thành "auto"
   - **Endpoint**: Điền tên miền dịch vụ hoặc địa chỉ IP đã triển khai
   - Cần đặt Full access URL style thành Path-Style

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Có thể tham khảo dịch vụ tệp ở trên để cấu hình, logic tương tự

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Có thể tham khảo dịch vụ tệp ở trên để cấu hình, logic tương tự

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414154500264.png)


## Cách sử dụng

Tham khảo hướng dẫn sử dụng plugin file-manager tại https://docs.nocobase.com/data-sources/file-manager/.