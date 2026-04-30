# Node Nhân viên AI

## Giới thiệu

Node Nhân viên AI được dùng để chỉ định Nhân viên AI hoàn thành tác vụ được chỉ định trong Workflow rồi đầu ra thông tin có cấu trúc.

Sau khi tạo Workflow, có thể chọn Node Nhân viên AI khi thêm Node Workflow.

![20260420142250](https://static-docs.nocobase.com/20260420142250.png)

## Cấu hình node
### Công việc chuẩn bị

Trước khi cấu hình Node Nhân viên AI, cần tìm hiểu cách xây dựng Workflow, cách cấu hình dịch vụ LLM, cũng như tác dụng của Nhân viên AI tích hợp sẵn và cách tạo Nhân viên AI.

Có thể xem các tài liệu sau:
  - [Workflow](/workflow)
  - [Cấu hình dịch vụ LLM](/ai-employees/features/llm-service)
  - [Nhân viên AI tích hợp sẵn](/ai-employees/features/built-in-employee)
  - [Tạo Nhân viên AI mới](/ai-employees/features/new-ai-employees)

### Tác vụ
#### Chọn Nhân viên AI

Chọn một Nhân viên AI chịu trách nhiệm xử lý tác vụ của Node này. Từ danh sách thả xuống chọn một Nhân viên AI tích hợp sẵn đã được kích hoạt trong hệ thống hoặc Nhân viên AI bạn đã tạo.

![20260420143554](https://static-docs.nocobase.com/20260420143554.png)

#### Chọn mô hình

Chọn mô hình LLM điều khiển Nhân viên AI. Từ danh sách thả xuống chọn một mô hình do dịch vụ LLM đã được cấu hình trong hệ thống cung cấp.

![20260420145057](https://static-docs.nocobase.com/20260420145057.png)

#### Chọn người thao tác

Chọn một người dùng trong hệ thống để cung cấp quyền truy cập dữ liệu cho Nhân viên AI, khi Nhân viên AI truy vấn dữ liệu sẽ bị giới hạn trong phạm vi quyền của người dùng đó.

Nếu trigger cung cấp người thao tác (như `Custom action event`), thì ưu tiên sử dụng quyền của người thao tác đó.

![20260420145244](https://static-docs.nocobase.com/20260420145244.png)

#### Prompt và mô tả tác vụ

`Background` sẽ được dùng làm Prompt hệ thống gửi cho AI, thường được dùng để mô tả thông tin nền của tác vụ và điều kiện ràng buộc.

`Default user message` là Prompt người dùng gửi cho AI, thường mô tả nội dung tác vụ, nói cho AI biết cần làm gì.

![20260420174515](https://static-docs.nocobase.com/20260420174515.png)

#### Tệp đính kèm

`Attachments` sẽ được gửi cho AI cùng với `Default user message`. Thường là tài liệu hoặc hình ảnh mà tác vụ cần xử lý.

Tệp đính kèm hỗ trợ hai loại:

1. `File(load via Files collection)` Sử dụng khóa chính để lấy dữ liệu từ bảng tệp được chỉ định làm tệp đính kèm gửi cho AI.

![20260420150933](https://static-docs.nocobase.com/20260420150933.png)

2. `File via URL` Lấy tệp từ URL được chỉ định và làm tệp đính kèm gửi cho AI.

![20260420151702](https://static-docs.nocobase.com/20260420151702.png)

#### Skills và Tools

Thông thường một Nhân viên AI sẽ liên kết nhiều Skill và Tool, ở đây có thể giới hạn chỉ sử dụng một số Skill hoặc Tool nào đó trong tác vụ hiện tại.

Mặc định là `Preset`, sử dụng các Skill và Tool được cài đặt sẵn của Nhân viên AI. Thiết lập là `Customer` có thể chọn chỉ sử dụng một số Skill hoặc Tool của Nhân viên AI.

![20260426231701](https://static-docs.nocobase.com/20260426231701.png)

#### Tìm kiếm trên web

Công tắc `Web search` kiểm soát việc AI của Node hiện tại có sử dụng năng lực tìm kiếm trên web hay không, về tìm kiếm trên web của Nhân viên AI xem: [Tìm kiếm trên web](/ai-employees/features/web-search)

![20260426231945](https://static-docs.nocobase.com/20260426231945.png)

### Phản hồi và thông báo
#### Đầu ra có cấu trúc

Người dùng có thể định nghĩa cấu trúc dữ liệu cuối cùng của Node Nhân viên AI đầu ra theo đặc tả [JSON Schema](https://json-schema.org/).

![20260426232117](https://static-docs.nocobase.com/20260426232117.png)

Các Node khác trong Workflow lấy dữ liệu Node Nhân viên AI cũng sẽ tạo tùy chọn theo `JSON Schema` này.

![20260426232509](https://static-docs.nocobase.com/20260426232509.png)

##### Giá trị mặc định

Mặc định cung cấp định nghĩa `JSON Schema` sau, nó định nghĩa một đối tượng, đối tượng chứa một thuộc tính có tên là result và loại là chuỗi. Và đặt một tiêu đề cho thuộc tính: Result.

```json
{
  "type": "object",
  "properties": {
    "result": {
      "title": "Result",
      "type": "string",
      "description": "The text message sent to the user"
    }
  }
}
```

Theo định nghĩa này, Node Nhân viên AI sẽ đầu ra dữ liệu cấu trúc JSON phù hợp với định nghĩa.

```json
{
  result: "Some text generated from LLM "
}
```

#### Cài đặt phê duyệt

Node hỗ trợ ba chế độ phê duyệt

- `No required` Nội dung đầu ra của AI không cần xét duyệt thủ công. Sau khi AI kết thúc đầu ra, Workflow tự động tiếp tục lưu chuyển.
- `Human decision` Nội dung đầu ra của AI phải thông báo cho người xét duyệt để xét duyệt thủ công, sau khi xét duyệt thủ công Workflow mới tiếp tục lưu chuyển.
- `AI decision` Do AI quyết định có thông báo cho người xét duyệt để xét duyệt thủ công nội dung đầu ra hay không.

![20260426232232](https://static-docs.nocobase.com/20260426232232.png)

Nếu chế độ phê duyệt không phải `No required`, thì phải cấu hình một hoặc nhiều người xét duyệt cho Node.

Khi AI trong Node Nhân viên AI đầu ra xong tất cả nội dung, sẽ gửi thông báo cho tất cả người xét duyệt được cấu hình cho Node đó. Chỉ cần một trong những người xét duyệt được thông báo hoàn thành thao tác phê duyệt, Workflow có thể tiếp tục lưu chuyển.

![20260426232319](https://static-docs.nocobase.com/20260426232319.png)
