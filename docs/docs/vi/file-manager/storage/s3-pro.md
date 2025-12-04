---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Công cụ lưu trữ: S3 (Pro)

## Giới thiệu

Dựa trên plugin quản lý tệp, tính năng này bổ sung hỗ trợ các loại lưu trữ tệp tương thích với giao thức S3. Bất kỳ dịch vụ lưu trữ đối tượng nào hỗ trợ giao thức S3 đều có thể dễ dàng tích hợp, chẳng hạn như Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, v.v., giúp nâng cao hơn nữa khả năng tương thích và tính linh hoạt của các dịch vụ lưu trữ.

## Tính năng nổi bật

1. **Tải lên từ phía máy khách**: Quá trình tải tệp lên không cần thông qua máy chủ NocoBase mà kết nối trực tiếp với dịch vụ lưu trữ tệp, mang lại trải nghiệm tải lên hiệu quả và nhanh chóng hơn.
    
2. **Truy cập riêng tư**: Khi truy cập tệp, tất cả các URL đều là địa chỉ được ủy quyền tạm thời có chữ ký, đảm bảo tính bảo mật và thời hạn của việc truy cập tệp.


## Trường hợp sử dụng

1. **Quản lý bộ sưu tập tệp**: Tập trung quản lý và lưu trữ tất cả các tệp đã tải lên, hỗ trợ nhiều loại tệp và phương thức lưu trữ, giúp dễ dàng phân loại và truy xuất tệp.
    
2. **Lưu trữ trường tệp đính kèm**: Dùng để lưu trữ dữ liệu của các tệp đính kèm được tải lên trong biểu mẫu hoặc bản ghi, hỗ trợ liên kết với các bản ghi dữ liệu cụ thể.
  

## Cấu hình plugin

1. Bật plugin `plugin-file-storage-s3-pro`.
    
2. Nhấp vào "Setting -> FileManager" để vào cài đặt quản lý tệp.

3. Nhấp vào nút "Add new" và chọn "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Sau khi cửa sổ bật lên xuất hiện, bạn sẽ thấy một biểu mẫu với nhiều trường cần điền. Bạn có thể tham khảo tài liệu tiếp theo để lấy thông tin tham số liên quan cho dịch vụ tệp tương ứng và điền chính xác vào biểu mẫu.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Cấu hình nhà cung cấp dịch vụ

### Amazon S3

#### Tạo Bucket

1. Mở https://ap-southeast-1.console.aws.amazon.com/s3/home để vào bảng điều khiển S3.
    
2. Nhấp vào nút "Create bucket" ở bên phải.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Điền Tên Bucket (tên vùng lưu trữ). Các trường khác có thể giữ nguyên cài đặt mặc định. Cuộn xuống cuối trang và nhấp vào nút "**Create**" để hoàn tất việc tạo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Cấu hình CORS

1. Vào danh sách các bucket, tìm và nhấp vào bucket bạn vừa tạo để vào trang chi tiết của nó.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Nhấp vào tab "Permission", sau đó cuộn xuống để tìm phần cấu hình CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Nhập cấu hình sau (bạn có thể tùy chỉnh chi tiết hơn) và lưu lại.
    
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

1. Nhấp vào nút "Security credentials" ở góc trên bên phải trang.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Cuộn xuống, tìm phần "Access Keys" và nhấp vào nút "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Nhấp vào Đồng ý (đây là bản demo với tài khoản gốc; bạn nên sử dụng IAM trong môi trường sản xuất).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Lưu Access key và Secret access key hiển thị trên trang.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Lấy và cấu hình tham số

1. AccessKey ID và AccessKey Secret là các giá trị bạn đã lấy được ở bước trước, vui lòng điền chính xác.
    
2. Vào bảng điều khiển thuộc tính của trang chi tiết bucket, bạn có thể lấy thông tin Tên Bucket và Region (khu vực) tại đây.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Truy cập công khai (Tùy chọn)

Đây là một cấu hình không bắt buộc. Cấu hình khi bạn cần công khai hoàn toàn các tệp đã tải lên.

1. Vào bảng điều khiển Permissions, cuộn xuống Object Ownership, nhấp vào chỉnh sửa và bật ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Cuộn đến Block public access, nhấp vào chỉnh sửa và đặt thành cho phép kiểm soát ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Trong NocoBase, chọn Public access.


#### Cấu hình hình thu nhỏ (Tùy chọn)

Cấu hình này là tùy chọn và được sử dụng để tối ưu hóa kích thước hoặc hiệu ứng xem trước hình ảnh. **Xin lưu ý rằng giải pháp triển khai này có thể phát sinh thêm chi phí. Để biết chi phí cụ thể, vui lòng tham khảo các điều khoản liên quan của AWS.**

1. Truy cập [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Nhấp vào nút ``Launch in the AWS Console`` ở cuối trang để bắt đầu triển khai giải pháp.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Làm theo hướng dẫn để hoàn tất cấu hình. Hãy đặc biệt chú ý đến các tùy chọn sau:
   1. Khi tạo stack, bạn cần chỉ định tên của một bucket Amazon S3 chứa các hình ảnh nguồn. Vui lòng nhập tên bucket bạn đã tạo trước đó.
   2. Nếu bạn chọn triển khai giao diện người dùng demo, bạn có thể kiểm tra các tính năng xử lý hình ảnh thông qua giao diện này sau khi triển khai. Trong bảng điều khiển AWS CloudFormation, chọn stack của bạn, chuyển đến tab "Outputs", tìm giá trị tương ứng với khóa DemoUrl và nhấp vào liên kết để mở giao diện demo.
   3. Giải pháp này sử dụng thư viện Node.js `sharp` để xử lý hình ảnh hiệu quả. Bạn có thể tải mã nguồn từ kho lưu trữ GitHub và tùy chỉnh theo nhu cầu.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Sau khi cấu hình hoàn tất, hãy đợi trạng thái triển khai chuyển sang `CREATE_COMPLETE`.

5. Trong cấu hình NocoBase, có một số điểm cần lưu ý sau:
   1. ``Thumbnail rule``: Điền các tham số liên quan đến xử lý hình ảnh, ví dụ: `?width=100`. Để biết chi tiết, tham khảo [tài liệu AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. ``Access endpoint``: Điền giá trị của Outputs -> ApiEndpoint sau khi triển khai.
   3. ``Full access URL style``: Cần chọn **Ignore** (vì tên bucket đã được điền trong quá trình cấu hình, nên không cần thiết khi truy cập).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### Tạo Bucket

1. Mở bảng điều khiển OSS https://oss.console.aliyun.com/overview.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Nhấp vào "Buckets" trong menu bên trái, sau đó nhấp vào nút "Create Bucket" để bắt đầu tạo bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Điền thông tin liên quan đến bucket và cuối cùng nhấp vào nút Create.
    
    1. Tên Bucket nên phù hợp với nhu cầu kinh doanh của bạn; tên có thể tùy ý.
        
    2. Chọn Region gần nhất với người dùng của bạn.
        
    3. Các cài đặt khác có thể giữ nguyên mặc định hoặc cấu hình dựa trên yêu cầu của bạn.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Cấu hình CORS

1. Vào trang chi tiết của bucket đã tạo ở bước trước.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Nhấp vào "Content Security -> CORS" trong menu giữa.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Nhấp vào nút "Create Rule", điền nội dung liên quan, cuộn xuống và nhấp vào "OK". Bạn có thể tham khảo ảnh chụp màn hình bên dưới hoặc cấu hình chi tiết hơn.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Lấy AccessKey và SecretAccessKey

1. Nhấp vào "AccessKey" bên dưới ảnh hồ sơ của bạn ở góc trên bên phải.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Để thuận tiện cho việc trình diễn, chúng tôi đang tạo AccessKey bằng tài khoản chính. Trong môi trường sản xuất, bạn nên sử dụng RAM để tạo. Bạn có thể tham khảo https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair
    
3. Nhấp vào nút "Create AccessKey". 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Thực hiện xác minh tài khoản.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Lưu Access key và Secret access key hiển thị trên trang.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Lấy và cấu hình tham số

1. AccessKey ID và AccessKey Secret là các giá trị đã lấy được ở bước trước.
    
2. Vào trang chi tiết bucket để lấy Tên Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Cuộn xuống để lấy Region (không cần phần ".aliyuncs.com" phía sau).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Lấy địa chỉ endpoint, và cần thêm tiền tố https:// khi điền vào NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Cấu hình hình thu nhỏ (Tùy chọn)

Cấu hình này là tùy chọn, chỉ nên được sử dụng khi bạn cần tối ưu hóa kích thước hoặc hiệu ứng xem trước hình ảnh.

1. Điền các tham số liên quan đến `Thumbnail rule`. Để biết cài đặt tham số cụ thể, tham khảo [Tham số xử lý hình ảnh](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. ``Full upload URL style`` và ``Full access URL style`` có thể giữ nguyên như nhau.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Tạo Bucket

1. Nhấp vào menu Buckets bên trái -> nhấp vào Create Bucket để vào trang tạo.
2. Sau khi điền tên Bucket, nhấp vào nút lưu.
#### Lấy AccessKey và SecretAccessKey

1. Vào Access Keys -> nhấp vào nút Create access key để vào trang tạo.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Nhấp vào nút lưu.

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Lưu Access Key và Secret Key từ cửa sổ bật lên để cấu hình sau này.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Cấu hình tham số

1. Vào trang NocoBase -> File manager.

2. Nhấp vào nút Add new và chọn S3 Pro.

3. Điền vào biểu mẫu:
   - **AccessKey ID** và **AccessKey Secret** là các giá trị đã lưu ở bước trước.
   - **Region**: MinIO được triển khai riêng không có khái niệm Region, nên có thể cấu hình là "auto".
   - **Endpoint**: Điền tên miền hoặc địa chỉ IP của dịch vụ đã triển khai.
   - Cần đặt Full access URL style thành Path-Style.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Bạn có thể tham khảo cấu hình của các dịch vụ tệp đã đề cập ở trên, vì logic tương tự.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Bạn có thể tham khảo cấu hình của các dịch vụ tệp đã đề cập ở trên, vì logic tương tự.

#### Ví dụ cấu hình

![](https://static-docs.nocobase.com/20250414154500264.png)