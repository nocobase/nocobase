---
title: "Định nghĩa Skill"
description: "Giới thiệu về vấn đề đầu tiên, nội dung từ nhắc nhở, liên kết công cụ và tự động khám phá thư mục của nhân viên NocoBase AI SKILLS.md."
keywords: "NocoBase,Kỹ năng nhân viên AI,SKILLS.md,Ràng buộc công cụ kỹ năng,báo cáo phân tích kinh doanh"
---

# Định nghĩa Skill

Kỹ năng không thực thi mã. Đây là hướng dẫn vận hành được cung cấp cho mô hình, trong đó chỉ rõ quy trình xử lý, các công cụ có sẵn, các bước kiểm tra và yêu cầu đầu ra.

## Thư mục Skill

Sử dụng một thư mục riêng cho từng Kỹ năng:

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

TRONG:

- `SKILLS.md` xác định siêu dữ liệu và văn bản từ nhắc nhở
- `tools/` Lưu các công cụ chỉ được sử dụng với Kỹ năng này
- Các công cụ tìm thấy trong `tools/` sẽ tự động được thêm vào danh sách công cụ của Kỹ năng này

## Frontmatter của `SKILLS.md`

Kỹ năng tối thiểu như sau:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

Các trường thường được sử dụng trong frontmatter như sau:

|Cánh đồng|tác dụng|
| --- | --- |
| `scope` |Phạm vi Kỹ năng có sẵn, `SPECIFIED` khi bị bỏ qua|
| `name` |Tên duy nhất của kỹ năng|
| `description` |Giúp mô hình xác định thời điểm tải Kỹ năng này|
| `introduction.title` |Tiêu đề hiển thị trên giao diện quản lý|
| `introduction.about` |Mô tả hiển thị giao diện quản lý|
| `tools` |Danh sách tên Tool bổ sung cần ràng buộc|

Nội dung Kỹ năng được lưu nguyên trạng và được thêm vào ngữ cảnh mô hình sau khi Kỹ năng được tải. Văn bản chính phải tập trung vào quy trình làm việc và các ràng buộc, đồng thời không sao chép chi tiết triển khai của Công cụ.

## Liên kết Tool với Skill

Có hai cách.

Đầu tiên là khai báo nó một cách rõ ràng trong frontmatter:

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

Cách thứ hai là đưa Tool vào thư mục `tools/` của Skill hiện tại:

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

Trình tải sẽ tự động khám phá `greetDeveloper` và hợp nhất nó vào danh sách công cụ của Kỹ năng. Các công cụ dành riêng cho Kỹ năng được khuyến nghị đặt trong thư mục Kỹ năng theo mặc định để vị trí tệp có thể thể hiện mối quan hệ ràng buộc.


## Cách viết kỹ năng tốt

Một Kỹ năng sử dụng được thường chứa những nội dung sau:

1. Ranh giới vai trò và nhiệm vụ
2. Trình tự xử lý phải tuân theo
3. Công cụ nào nên được gọi ở mỗi bước?
4. Trong trường hợp nào cần phải xác nhận với người dùng?
5. Cách xử lý sự cố của Công cụ
6. Cấu trúc và điều kiện xác minh của đầu ra cuối cùng

Nếu Công cụ sẽ sửa đổi dữ liệu, Kỹ năng cần yêu cầu rõ ràng mô hình chờ Công cụ trả về kết quả thành công và không thể khẳng định rằng thao tác đã hoàn thành trước khi gọi nó.

## Ví dụ về Kỹ năng tích hợp: `business-analysis-report`

`packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` chia nhỏ phân tích kinh doanh thành các quy trình công việc rõ ràng:

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

Văn bản không chỉ nói “lập báo cáo kinh doanh” mà còn quy định:

- Bắt đầu bằng cách hiểu mục tiêu, đối tượng, khung thời gian và số liệu của quyết định
- Khi có liên quan đến dữ liệu kinh doanh, ToolCall đầu tiên phải tải Kỹ năng `data-query`
- Không được phép đoán bảng dữ liệu, đường dẫn liên kết và kết quả truy vấn
- Chỉ gọi `businessReportGenerator` sau khi dữ liệu đã sẵn sàng
- Biểu đồ và báo cáo Markdown được tạo trong cùng một ToolCall
- Xác định thành công dựa trên `status`, `chartCount`, `errors` và `warnings` được Công cụ trả về
- Chỉ thử lại một lần nếu biểu đồ không thành công, sau đó quay lại báo cáo Markdown đơn giản

Loại quy tắc này là giá trị chính của Kỹ năng - nó cô đọng "những gì mô hình có thể làm" thành một quy trình có thể lặp lại, có thể kiểm tra được.

## Liên kết liên quan

- [Phát triển plugin nhân viên AI](./index.md) — Hiểu vị trí Kỹ năng phù hợp với tiện ích mở rộng Nhân viên AI
- [Định nghĩa Tool phía máy chủ](./define-tool.md) — xác định Công cụ mà Skill có thể gọi
- [Định nghĩa Nhân viên AI tích hợp sẵn](./define-ai-employee.md) — Kỹ năng ràng buộc với nhân viên cố định
- [Trở thành nhân viên AI trợ giúp phát triển](./complete-example.md) — Xem ví dụ ràng buộc đầy đủ về Kỹ năng và Công cụ
