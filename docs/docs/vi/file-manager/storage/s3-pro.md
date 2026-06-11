---
pkg: '@nocobase/plugin-file-storage-s3-pro'
title: "Storage engine: S3 Pro"
description: "S3 Pro tương thích giao thức S3: upload trực tiếp từ client, presigned URL, truy cập riêng tư, hỗ trợ cấu hình AWS S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2."
keywords: "S3 Pro,S3 tương thích,upload từ client,presigned URL,MinIO,Cloudflare R2,Object Storage,NocoBase"
---
# Storage engine: S3 (Pro)

## Giới thiệu

Trên cơ sở plugin File Manager, bổ sung hỗ trợ loại lưu trữ file tương thích giao thức S3. Bất kỳ dịch vụ Object Storage nào hỗ trợ giao thức S3 đều có thể tích hợp dễ dàng, ví dụ Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, v.v., nâng cao thêm tính tương thích và linh hoạt của dịch vụ lưu trữ.

## Tính năng nổi bật

1. Upload từ client: Quá trình upload file không cần thông qua server NocoBase, kết nối trực tiếp với dịch vụ lưu trữ file, mang lại trải nghiệm upload hiệu quả và nhanh chóng hơn.
    
2. Truy cập riêng tư: Khi truy cập file, tất cả URL đều là địa chỉ ủy quyền tạm thời có chữ ký, đảm bảo tính bảo mật và thời hạn của truy cập file.


## Tình huống sử dụng

1. **Quản lý bảng file**: Quản lý và lưu trữ tập trung tất cả các file đã upload, hỗ trợ nhiều loại file và phương thức lưu trữ, thuận tiện cho việc phân loại và tìm kiếm file.
    
2. **Lưu trữ field attachment**: Dùng để lưu trữ dữ liệu file đính kèm upload trong form hoặc bản ghi, hỗ trợ liên kết với bản ghi dữ liệu cụ thể.
  

## Cấu hình plugin

1. Bật plugin plugin-file-storage-s3-pro
    
2. Click "Setting-> FileManager" để vào File Manager Settings

3. Click nút "Add new", chọn "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Sau khi popup xuất hiện, bạn sẽ thấy có khá nhiều nội dung form cần điền. Có thể tham khảo tài liệu sau để lấy thông tin tham số liên quan của dịch vụ file tương ứng và điền chính xác vào form.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Cấu hình nhà cung cấp

### Amazon S3

#### Tạo Bucket

1. Mở https://ap-southeast-1.console.aws.amazon.com/s3/home để vào S3 Console
    
2. Click nút "Create bucket" bên phải

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Điền Bucket Name, các field khác có thể giữ mặc định, cuộn xuống cuối trang, click nút **"**Create**"** để hoàn tất tạo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Cấu hình CORS

1. Vào danh sách buckets, tìm và click vào Bucket vừa tạo để vào trang chi tiết

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Click tab "Permission", sau đó cuộn xuống tìm phần cấu hình CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Điền cấu hình sau (có thể tự tinh chỉnh cấu hình) và lưu
    
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

#### Lấy AccessKey, SecretAccessKey

1. Click nút "Security credentials" góc trên bên phải

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Cuộn xuống, tìm phần "Access Keys", click nút "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Click Đồng ý (ở đây minh họa với tài khoản chính, khuyến nghị sử dụng IAM trong môi trường chính thức).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Lưu Access key và Secret access key hiển thị trong trang

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Lấy và cấu hình tham số

1. AccessKey ID và AccessKey Secret là các giá trị bạn đã lấy được trong thao tác trên, hãy điền chính xác
    
2. Vào panel properties của trang chi tiết bucket, bạn có thể lấy được thông tin tên Bucket và Region.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Truy cập công khai (Tùy chọn)

Đây là cấu hình không bắt buộc, khi bạn cần để file upload hoàn toàn công khai thì cấu hình

1. Vào panel Permissions, cuộn xuống đến Object Ownership, click chỉnh sửa, bật ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Cuộn đến Block public access, click chỉnh sửa, đặt thành cho phép ACLs điều khiển

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Trong NocoBase tích chọn Public access


#### Cấu hình thumbnail (Tùy chọn)

Cấu hình này là tùy chọn, áp dụng khi cần tối ưu kích thước hoặc hiệu ứng preview hình ảnh. **Lưu ý, phương án triển khai này có thể phát sinh chi phí bổ sung, chi phí cụ thể vui lòng tham khảo các điều khoản liên quan của AWS.**

1. Truy cập [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Click nút `Launch in the AWS Console` ở cuối trang để bắt đầu triển khai phương án.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Theo hướng dẫn để hoàn tất cấu hình, một số tùy chọn sau cần đặc biệt lưu ý:
   1. Khi tạo stack, bạn cần chỉ định tên Bucket Amazon S3 chứa hình ảnh nguồn. Vui lòng điền tên Bucket bạn đã tạo trước đó.
   2. Nếu bạn đã chọn triển khai Demo UI, sau khi triển khai hoàn tất có thể test tính năng xử lý hình ảnh thông qua giao diện này. Trong AWS CloudFormation Console, chọn stack của bạn, vào tab "Outputs", tìm giá trị tương ứng với key DemoUrl, click vào liên kết đó để mở giao diện demo.
   3. Phương án này sử dụng thư viện Node.js `sharp` để xử lý hình ảnh hiệu quả. Bạn có thể tải mã nguồn từ GitHub repository và tùy chỉnh theo nhu cầu.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Sau khi cấu hình hoàn tất, chờ trạng thái triển khai chuyển sang `CREATE_COMPLETE` là được.

5. Trong cấu hình NocoBase, có một số lưu ý sau:
   1. `Thumbnail rule`: Điền tham số liên quan đến xử lý hình ảnh, ví dụ `?width=100`. Cụ thể có thể tham khảo [Tài liệu AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Điền giá trị ApiEndpoint trong Outputs sau khi triển khai.
   3. `Full access URL style`: Cần tích chọn **Ignore** (vì khi cấu hình đã điền tên Bucket, khi truy cập không cần nữa).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Tạo Bucket

1. Mở OSS Console https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Click "Buckets" trong menu bên trái, sau đó click nút "Create Bucket" để bắt đầu tạo Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Điền thông tin liên quan đến bucket, cuối cùng click nút Create
    
    1. Bucket Name phù hợp với nghiệp vụ của bạn, tên có thể tùy ý
        
    2. Region chọn khu vực gần với người dùng của bạn nhất
        
    3. Các nội dung khác có thể giữ mặc định, hoặc tự cấu hình theo nhu cầu

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Cấu hình CORS

1. Vào trang chi tiết bucket vừa tạo

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Click "Content Security -> CORS" trong menu giữa

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Click nút "Create Rule", điền nội dung liên quan, cuộn xuống và click "OK". Có thể tham khảo screenshot bên dưới hoặc cấu hình chi tiết hơn

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Lấy AccessKey, SecretAccessKey

1. Click "AccessKey" dưới avatar góc trên bên phải

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Ở đây để dễ minh họa, sử dụng tài khoản chính để tạo AccessKey, trong tình huống sử dụng chính thức khuyến nghị sử dụng RAM để tạo, có thể tham khảo https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp
    
3. Click nút "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Tiến hành xác minh tài khoản

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Lưu Access key và Secret access key hiển thị trong trang

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Lấy và cấu hình tham số

1. AccessKey ID và AccessKey Secret là các giá trị đã lấy trong thao tác trên
    
2. Vào trang chi tiết bucket, lấy Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Cuộn xuống, lấy Region (phần ".aliyuncs.com" phía sau không cần)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Lấy địa chỉ endpoint, khi điền vào NocoBase cần thêm tiền tố https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Cấu hình thumbnail (Tùy chọn)

Cấu hình này là tùy chọn, chỉ sử dụng khi cần tối ưu kích thước hoặc hiệu ứng preview hình ảnh.

1. Điền các tham số liên quan của `Thumbnail rule`. Cài đặt tham số cụ thể có thể tham khảo [Tham số xử lý hình ảnh](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. `Full upload URL style` và `Full access URL style` giữ giống nhau là được.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Tạo Bucket

1. Click menu Buckets bên trái -> Click Create Bucket để vào trang tạo
2. Điền tên Bucket, click nút lưu
#### Lấy AccessKey, SecretAccessKey

1. Vào Access Keys -> Click nút Create access key để vào trang tạo

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Click nút lưu

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Lưu Access Key và Secret Key trong popup, dùng cho cấu hình sau này

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Cấu hình tham số

1. Vào trang NocoBase -> File manager

2. Click nút Add new, chọn S3 Pro

3. Điền form
   - **AccessKey ID** và **AccessKey Secret** là văn bản đã lưu ở bước trước
   - **Region**: MinIO triển khai riêng tư không có khái niệm Region, có thể cấu hình thành "auto"
   - **Endpoint**: Điền tên miền hoặc địa chỉ IP của dịch vụ đã triển khai
   - Cần đặt Full access URL style thành Path-Style

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Có thể tham khảo các dịch vụ file ở trên để cấu hình, logic tương tự

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Có thể tham khảo các dịch vụ file ở trên để cấu hình, logic tương tự

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414154500264.png)
