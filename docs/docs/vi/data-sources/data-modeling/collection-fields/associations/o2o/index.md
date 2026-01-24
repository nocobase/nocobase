:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Một-một

Trong mối quan hệ giữa nhân viên và hồ sơ cá nhân, mỗi nhân viên chỉ có thể có một bản ghi hồ sơ cá nhân, và mỗi bản ghi hồ sơ cá nhân cũng chỉ có thể tương ứng với một nhân viên. Trong trường hợp này, mối quan hệ giữa nhân viên và hồ sơ cá nhân là một-một.

Khóa ngoại trong mối quan hệ một-một có thể đặt ở bộ sưu tập nguồn hoặc bộ sưu tập đích. Nếu mối quan hệ biểu thị "có một", khóa ngoại nên đặt ở bộ sưu tập đích sẽ phù hợp hơn; nếu biểu thị "thuộc về", thì khóa ngoại nên đặt ở bộ sưu tập nguồn sẽ phù hợp hơn.

Ví dụ như trường hợp trên, một nhân viên chỉ có một hồ sơ cá nhân, và hồ sơ cá nhân đó thuộc về nhân viên, vì vậy khóa ngoại phù hợp để đặt trong bộ sưu tập hồ sơ cá nhân.

## Một-một (Có một)

Điều này biểu thị rằng một nhân viên có một bản ghi hồ sơ cá nhân.

Mối quan hệ ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Cấu hình trường

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Một-một (Thuộc về)

Điều này biểu thị rằng một hồ sơ cá nhân thuộc về một nhân viên cụ thể.

Mối quan hệ ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98573ca24ac72d.png)

Cấu hình trường

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Mô tả tham số

### Bộ sưu tập nguồn

Bộ sưu tập nguồn là bộ sưu tập chứa trường hiện tại.

### Bộ sưu tập đích

Bộ sưu tập đích là bộ sưu tập được liên kết đến.

### Khóa ngoại

Dùng để thiết lập mối quan hệ giữa hai bộ sưu tập. Trong mối quan hệ một-một, khóa ngoại có thể đặt ở bộ sưu tập nguồn hoặc bộ sưu tập đích. Nếu biểu thị "có một", khóa ngoại nên đặt ở bộ sưu tập đích sẽ phù hợp hơn; nếu biểu thị "thuộc về", thì khóa ngoại nên đặt ở bộ sưu tập nguồn sẽ phù hợp hơn.

### Khóa nguồn <- Khóa ngoại (Khóa ngoại ở bộ sưu tập đích)

Trường được tham chiếu bởi ràng buộc khóa ngoại phải là duy nhất. Khi khóa ngoại đặt ở bộ sưu tập đích, điều này biểu thị "có một".

### Khóa đích <- Khóa ngoại (Khóa ngoại ở bộ sưu tập nguồn)

Trường được tham chiếu bởi ràng buộc khóa ngoại phải là duy nhất. Khi khóa ngoại đặt ở bộ sưu tập nguồn, điều này biểu thị "thuộc về".

### ON DELETE

ON DELETE đề cập đến các quy tắc thao tác đối với tham chiếu khóa ngoại trong bộ sưu tập con liên quan khi xóa các bản ghi từ bộ sưu tập cha. Đây là một tùy chọn được định nghĩa khi thiết lập ràng buộc khóa ngoại. Các tùy chọn ON DELETE phổ biến bao gồm:

- CASCADE: Khi một bản ghi trong bộ sưu tập cha bị xóa, tự động xóa tất cả các bản ghi liên quan trong bộ sưu tập con.
- SET NULL: Khi một bản ghi trong bộ sưu tập cha bị xóa, đặt giá trị khóa ngoại liên quan trong bộ sưu tập con thành NULL.
- RESTRICT: Tùy chọn mặc định, khi cố gắng xóa một bản ghi trong bộ sưu tập cha, nếu có các bản ghi liên quan trong bộ sưu tập con, thì việc xóa bản ghi cha sẽ bị từ chối.
- NO ACTION: Tương tự như RESTRICT, nếu có các bản ghi liên quan trong bộ sưu tập con, thì việc xóa bản ghi cha sẽ bị từ chối.