---
title: "File Storage: S3 (Pro)"
description: "S3 Pro storage engine, lưu trữ cấp doanh nghiệp tương thích với giao thức S3, hỗ trợ Endpoint tùy chỉnh và cấu hình nâng cao."
keywords: "S3 Pro,Object Storage,Cloud storage,S3 compatible,NocoBase"
---

# File Storage: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Giới thiệu

Trên cơ sở plugin file management, hỗ trợ thêm kiểu file storage tương thích với giao thức S3. Bất kỳ dịch vụ object storage nào hỗ trợ giao thức S3 đều có thể dễ dàng tích hợp, ví dụ Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, v.v., nâng cao hơn nữa tính tương thích và linh hoạt của dịch vụ storage.

## Đặc điểm chức năng

1. Upload phía client: Quá trình upload file không cần đi qua server NocoBase, kết nối trực tiếp với dịch vụ file storage, đem lại trải nghiệm upload hiệu quả và nhanh hơn.
    
2. Truy cập riêng tư: Khi truy cập file, tất cả URL đều là địa chỉ ủy quyền tạm thời được ký, đảm bảo tính bảo mật và thời hạn của việc truy cập file.


## Tình huống sử dụng

1. **Quản lý File Collection**: Quản lý và lưu trữ tập trung tất cả file được upload, hỗ trợ nhiều kiểu file và cách lưu trữ, thuận tiện cho việc phân loại và tìm kiếm file.
    
2. **Lưu trữ Field Attachment**: Dùng để lưu trữ dữ liệu attachment được upload trong form hoặc bản ghi, hỗ trợ liên kết với bản ghi dữ liệu cụ thể.
  

## Cấu hình Plugin

1. Bật plugin plugin-file-storage-s3-pro
    
2. Nhấn "Setting -> FileManager" để vào cài đặt File Manager

3. Nhấn nút "Add new", chọn "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Sau khi popup hiện ra, bạn sẽ thấy nội dung form cần điền khá nhiều. Có thể tham khảo tài liệu sau, lấy thông tin tham số liên quan đến dịch vụ file tương ứng, và điền đúng vào form.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Cấu hình nhà cung cấp dịch vụ

### Amazon S3

#### Tạo Bucket

1. Mở https://ap-southeast-1.console.aws.amazon.com/s3/home để vào S3 Console
    
2. Nhấn nút "Create bucket" bên phải

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Điền Bucket Name (tên bucket), các field khác có thể giữ cài đặt mặc định, cuộn xuống cuối trang, nhấn nút **"Create"** để hoàn tất việc tạo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Cấu hình CORS

1. Vào danh sách buckets, tìm và nhấn vào Bucket vừa tạo để vào trang chi tiết của nó

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Nhấn tab "Permission", sau đó cuộn xuống tìm phần cấu hình CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Điền cấu hình sau (có thể tinh chỉnh chi tiết), và lưu
    
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

1. Nhấn nút "Security credentials" ở góc trên bên phải trang

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Cuộn xuống, tìm phần "Access Keys", nhấn nút "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Nhấn Đồng ý (đây là demo cho main account, khuyến nghị sử dụng IAM trong môi trường chính thức).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Lưu Access key và Secret access key được hiển thị trên trang

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Lấy và cấu hình tham số

1. AccessKey ID và AccessKey Secret là các giá trị tương ứng bạn đã lấy được trong bước trước, vui lòng điền chính xác
    
2. Vào panel properties của trang chi tiết bucket, bạn có thể lấy được thông tin Bucket name và Region.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Truy cập công khai (tùy chọn)

Đây là cấu hình không bắt buộc, hãy cấu hình khi bạn cần công khai hoàn toàn file đã upload

1. Vào panel Permissions, cuộn xuống Object Ownership, nhấn edit, bật ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Cuộn đến Block public access, nhấn edit, đặt thành cho phép ACLs control

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Trong NocoBase tích chọn Public access


#### Cấu hình Thumbnail (tùy chọn)

Cấu hình này là tùy chọn, dùng khi cần tối ưu kích thước hoặc hiệu ứng preview hình ảnh. **Lưu ý, phương án triển khai này có thể phát sinh chi phí phụ, chi phí cụ thể vui lòng tham khảo các điều khoản liên quan của AWS.**

1. Truy cập [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Nhấn nút `Launch in the AWS Console` ở cuối trang, bắt đầu triển khai phương án.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Hoàn tất cấu hình theo hướng dẫn, các tùy chọn sau cần đặc biệt chú ý:
   1. Khi tạo stack, bạn cần chỉ định một tên Amazon S3 bucket chứa hình ảnh nguồn. Vui lòng điền tên bucket bạn đã tạo trước đó.
   2. Nếu bạn chọn triển khai demo UI, sau khi triển khai xong có thể test chức năng xử lý hình ảnh thông qua giao diện này. Trong AWS CloudFormation Console, chọn stack của bạn, vào tab "Outputs", tìm giá trị tương ứng với key DemoUrl, nhấn link đó để mở giao diện demo.
   3. Phương án này sử dụng thư viện `sharp` Node.js để xử lý hình ảnh hiệu quả. Bạn có thể tải mã nguồn từ GitHub repo, tùy chỉnh theo nhu cầu.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Sau khi cấu hình xong, đợi trạng thái triển khai chuyển thành `CREATE_COMPLETE` là được.

5. Trong cấu hình NocoBase, có một số lưu ý sau:
   1. `Thumbnail rule`: Điền tham số liên quan đến xử lý hình ảnh, ví dụ `?width=100`. Cụ thể có thể tham khảo [Tài liệu AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Điền giá trị Outputs -> ApiEndpoint sau khi triển khai.
   3. `Full access URL style`: Cần tích chọn **Ignore** (vì đã điền tên bucket khi cấu hình, không cần khi truy cập).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Tạo Bucket

1. Mở OSS Console https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Nhấn vào "Buckets" trong menu bên trái, sau đó nhấn nút "Create Bucket" để bắt đầu tạo bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Điền thông tin liên quan đến bucket, cuối cùng nhấn nút Create
    
    1. Bucket Name phù hợp với business của bạn, tên tùy ý
        
    2. Region chọn region gần nhất với người dùng của bạn
        
    3. Nội dung khác có thể mặc định, hoặc tự cấu hình theo nhu cầu

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Cấu hình CORS

1. Vào trang chi tiết bucket vừa tạo

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Nhấn vào "Content Security -> CORS" trong menu giữa

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Nhấn nút "Create Rule", và điền nội dung liên quan, cuộn xuống dưới nhấn "OK". Có thể tham khảo screenshot bên dưới, hoặc thiết lập chi tiết hơn

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Lấy AccessKey, SecretAccessKey

1. Nhấn "AccessKey" bên dưới avatar góc trên bên phải

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Để tiện demo, sử dụng main account để tạo AccessKey, trong tình huống sử dụng chính thức khuyến nghị dùng RAM để tạo, có thể tham khảo https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp
    
3. Nhấn nút "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Tiến hành xác minh tài khoản

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Lưu Access key và Secret access key được hiển thị trên trang

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Lấy và cấu hình tham số

1. AccessKey ID và AccessKey Secret là các giá trị đã lấy được trong bước trước
    
2. Vào trang chi tiết bucket, lấy được Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Cuộn xuống, lấy được Region (phần ".aliyuncs.com" phía sau không cần)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Lấy được địa chỉ endpoint, khi điền vào NocoBase cần thêm tiền tố https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Cấu hình Thumbnail (tùy chọn)

Cấu hình này là tùy chọn, chỉ dùng khi cần tối ưu kích thước hoặc hiệu ứng preview hình ảnh.

1. Điền tham số liên quan `Thumbnail rule`. Cài đặt tham số cụ thể có thể tham khảo [Tham số xử lý hình ảnh](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. `Full upload URL style` và `Full access URL style` giữ giống nhau là được.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Tạo Bucket

1. Nhấn menu Buckets bên trái -> Nhấn Create Bucket, vào trang tạo
2. Sau khi điền tên Bucket, nhấn nút save
#### Lấy AccessKey, SecretAccessKey

1. Vào Access Keys -> Nhấn nút Create access key, vào trang tạo

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Nhấn nút save

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Lưu Access Key và Secret Key trong popup, dùng cho cấu hình sau

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Cấu hình tham số

1. Vào trang NocoBase -> File manager

2. Nhấn nút Add new, chọn S3 Pro

3. Điền form
   - **AccessKey ID** và **AccessKey Secret** là văn bản đã lưu ở bước trước
   - **Region**: MinIO triển khai riêng tư không có khái niệm Region, có thể cấu hình thành "auto"
   - **Endpoint**: Điền domain hoặc địa chỉ ip dịch vụ đã triển khai
   - Cần đặt Full access URL style thành Path-Style

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Có thể tham khảo cấu hình các dịch vụ file ở trên, logic tương tự

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Có thể tham khảo cấu hình các dịch vụ file ở trên, logic tương tự

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414154500264.png)


## Sử dụng cho người dùng

Tham khảo cách dùng plugin file-manager https://docs.nocobase.com/data-sources/file-manager/
