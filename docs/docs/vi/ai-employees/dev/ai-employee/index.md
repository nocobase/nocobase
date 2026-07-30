---
title: "Phát triển plugin Nhân viên AI"
description: "Giới thiệu mối quan hệ, quy ước thư mục và lộ trình học tập giữa Công cụ, Kỹ năng, nhân viên AI tích hợp và Giao diện người dùng Công cụ giao diện người dùng trong plug-in NocoBase."
keywords: "NocoBase, phát triển plug-in nhân viên AI, Công cụ, Kỹ năng, defineAIEmployee, src/ai"
---

# Phát triển plugin Nhân viên AI

Trong NocoBase, các plug-in có thể chuyển giao khả năng kinh doanh của chúng cho nhân viên AI. Ba điểm mở rộng chịu trách nhiệm cho các cấp độ khác nhau:

- **Công cụ** — Thực hiện các thao tác cụ thể như truy vấn dữ liệu, gọi API, sửa đổi bản ghi, v.v.
- **Kỹ năng** — cho mô hình biết khi nào nên sử dụng một công cụ và những bước cần thực hiện để hoàn thành nhiệm vụ
- **Nhân viên AI tích hợp** — Tập hợp hồ sơ nhân vật, lời nhắc hệ thống, kỹ năng và công cụ thành một nhân viên vượt trội

Nói chung, bạn không cần phải gọi thủ công giao diện đăng ký. Sau khi đặt tệp vào thư mục `src/ai` đã được đồng ý của plug-in, NocoBase sẽ tự động quét và hoàn tất đăng ký khi tải plug-in. Chỉ khi Công cụ cần tùy chỉnh thẻ, cửa sổ bật lên hoặc logic thực thi phía trình duyệt thì Công cụ mới cần đăng ký các thành phần giao diện người dùng hoặc logic thực thi tương ứng trong `src/client-v2/plugin.tsx` của trình cắm.

Trước khi bắt đầu, bạn cần đảm bảo rằng ứng dụng đã được cài đặt và kích hoạt `@nocobase/plugin-ai`. Mã trình cắm có thể sử dụng các loại và hàm định nghĩa được cung cấp bởi `@nocobase/ai` và `@nocobase/actions`.

:::tip Đọc trước

- [Viết plug-in đầu tiên](../../../plugin-development/write-your-first-plugin.md) - Nếu bạn không có kinh nghiệm trong việc phát triển plug-in, trước tiên hãy tìm hiểu thư mục plug-in, quá trình xây dựng và hỗ trợ
- [Nhân viên AI](../../index.md) — Trước tiên hãy làm quen với cấu hình và cách sử dụng cơ bản của Nhân viên AI

:::


## Tra cứu nhanh

| Tôi muốn... | Xem ở đâu |
| --- | --- |
| Cho phép AI gọi một thao tác phía máy chủ | [Định nghĩa Tool phía máy chủ](./define-tool.md) |
| Quy định quy trình gọi nhiều Tool | [Định nghĩa Skill](./define-skill.md) |
| Cung cấp một vai trò AI cố định cùng plugin | [Định nghĩa Nhân viên AI tích hợp sẵn](./define-ai-employee.md) |
| Xem cách kết hợp hoàn chỉnh Tool, Skill và nhân viên | [Ví dụ hoàn chỉnh: Tạo Nhân viên AI tích hợp sẵn](./complete-example.md) |
| Thêm giao diện xác nhận, lựa chọn hoặc chỉnh sửa cho Tool | [Thêm tương tác frontend cho Tool](./frontend-tool-ui.md) |
| Thêm bản dịch giao diện quản lý cho Tool và Skill | [Quốc tế hóa plugin Nhân viên AI](./internationalization.md) |
| Khắc phục sự cố đăng ký, liên kết và thực thi | [Các vấn đề thường gặp](./troubleshooting.md) |

## Quyết định lớp nào bạn muốn mở rộng đầu tiên

Công cụ, kỹ năng và nhân viên AI tích hợp không phải là ba chức năng độc lập mà là các khả năng được kết hợp từng lớp từ dưới lên. Không phải mọi plugin đều cần triển khai cả ba lớp.

```text
Tool：让 AI 能执行一个具体动作
  ↓
Skill：让 AI 按固定方法完成一类任务
  ↓
内置 AI 员工：把这些能力装配成一个固定角色和使用入口
```

Bạn có thể xác định cấp độ nào sẽ bắt đầu dựa trên nhu cầu của mình:

- Chỉ cần để AI truy vấn dữ liệu, gọi API hoặc sửa đổi bản ghi và xác định Công cụ.
- Cần phải chỉ định trình tự gọi công cụ, các bước xác nhận và định dạng đầu ra, sau đó xác định Kỹ năng cho các Công cụ này
- Nếu bạn muốn cung cấp vai trò cố định ngay sau khi plugin được bật, hãy tiếp tục tạo nhân viên AI tích hợp và liên kết Kỹ năng và Công cụ tương ứng

Khi cả ba lớp được sử dụng, một tác vụ sẽ được thực hiện theo thứ tự sau:

1. Người dùng yêu cầu nhân viên AI thực hiện nhiệm vụ
2. Nhân viên AI xác định Kỹ năng nào cần sử dụng dựa trên các từ nhắc nhở của hệ thống
3. Kỹ năng cho mô hình biết nên gọi Công cụ nào và theo thứ tự nào
4. Công cụ thực hiện truy vấn, ghi hoặc yêu cầu bên ngoài và trả về kết quả
5. Nhân viên AI tổ chức phản hồi cuối cùng dựa trên kết quả của Tool

Thẻ ngoại vi của công cụ không phải là khả năng cấp thứ tư. Nó chỉ bổ sung giao diện tương tác cho ToolCall khi Công cụ yêu cầu người dùng xác nhận, lựa chọn các tùy chọn hoặc chỉnh sửa các tham số.

## Đưa tài nguyên AI vào `src/ai`

NocoBase khám phá tài nguyên AI trong plugin theo quy ước thư mục. Khi sử dụng thư mục plug-in tiêu chuẩn, chỉ cần đặt Tool, Skill và AI tích hợp vào `src/ai`. Không cần phải đăng ký từng cái một trong `src/server/plugin.ts` và `load()`.

Một thư mục hoàn chỉnh có thể được tổ chức như thế này:

```text
src/ai/
├── tools/
│   └── searchDocs.ts
├── skills/
│   └── document-search/
│       ├── SKILLS.md
│       └── tools/
│           └── readDocument.ts
└── ai-employees/
    ├── translator.ts
    └── developer/
        ├── index.ts
        ├── prompt.md
        ├── skills/
        └── tools/
```

Các địa điểm khác nhau tương ứng với các phương thức đăng ký khác nhau:

|tập tin hoặc thư mục|NocoBase hoạt động như thế nào|
| --- | --- |
| `src/ai/tools/<name>.ts` |Đăng ký một công cụ độc lập|
| `src/ai/skills/<name>/SKILLS.md` |Đăng ký kỹ năng|
|`tools/` trong thư mục Kỹ năng|Đăng ký Công cụ và tự động liên kết với Kỹ năng hiện tại|
| `src/ai/ai-employees/<name>.ts` |Đăng ký một nhân viên AI tích hợp một tệp|
| `src/ai/ai-employees/<name>/index.ts` |Đăng ký nhân viên AI tích hợp kiểu thư mục|
|`prompt.md` trong thư mục nhân viên AI|Là lời nhắc hệ thống mặc định cho nhân viên này|
|`skills/` và `tools/` trong thư mục nhân viên AI|Đăng ký tài nguyên và tự động liên kết chúng với nhân viên hiện tại|

Khi plugin được tải, NocoBase sẽ hoàn thành các tác vụ này theo thứ tự trước khi thực thi `load()` của chính plugin:

1. Công cụ quét và đăng ký
2. Phân tích cú pháp `SKILLS.md` và liên kết Công cụ trong thư mục Kỹ năng với Kỹ năng tương ứng
3. Tải nhân viên AI tích hợp và hợp nhất `prompt.md`, Kỹ năng và Công cụ trong thư mục nhân viên

`src/client-v2` không thuộc nhóm thư mục quét tự động này. Chỉ khi Công cụ cần thẻ giao diện người dùng, cửa sổ bật lên hoặc logic thực thi phía trình duyệt thì mới cần đăng ký bổ sung trong `src/client-v2/plugin.tsx`.

## Tra cứu nhanh điểm mở rộng và thư mục

|điểm mở rộng|Chịu trách nhiệm về việc gì|Đặt nó ở đâu theo mặc định|
| --- | --- | --- |
| Tool |Thực hiện các hoạt động cụ thể như truy vấn, ghi hoặc yêu cầu bên ngoài| `src/ai/**/tools/` |
| Skill |Chỉ định luồng xử lý, trình tự gọi công cụ và các ràng buộc đầu ra| `src/ai/**/skills/<name>/SKILLS.md` |
|Nhân viên AI tích hợp|Xác định vai trò cố định và tập hợp các lời nhắc, kỹ năng và công cụ của hệ thống| `src/ai/ai-employees/` |
|Thẻ mặt trước của công cụ|Hiển thị ToolCall và thu thập các hành động xác nhận, chỉnh sửa hoặc từ chối| `src/client-v2/` |

Công cụ được triển khai đầu tiên theo mặc định. Thêm các kỹ năng khi cần một quy trình làm việc cố định và tạo nhân viên AI tích hợp khi cần có mục nhập vai trò cố định; chỉ thêm thẻ giao diện người dùng khi công cụ yêu cầu tương tác với trình duyệt.

## Liên kết liên quan

- [Viết plugin đầu tiên của bạn](../../../plugin-development/write-your-first-plugin.md) — Tạo và chạy plugin NocoBase từ đầu
- [Tổng quan về nhân viên AI](../../index.md) — Tìm hiểu cách sử dụng nhân viên AI
- [Hướng dẫn kỹ thuật nhắc nhở](../../configuration/prompt-engineering-guide.md) — Viết các từ nhắc nhở của hệ thống và các ràng buộc về nhiệm vụ
