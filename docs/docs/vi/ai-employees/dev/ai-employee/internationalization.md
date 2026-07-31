---
title: "Quốc tế hóa plugin Nhân viên AI"
description: "Giải thích tệp quốc tế hóa, mẫu bản dịch và các giới hạn hiện tại đối với Tool, Skill và hồ sơ nhân viên tích hợp sẵn trong plugin Nhân viên AI NocoBase."
keywords: "NocoBase,quốc tế hóa plugin Nhân viên AI,giới thiệu Tool,giới thiệu Skill,locale"
---

# Quốc tế hóa plugin Nhân viên AI

Văn bản trong giao diện quản lý của plugin Nhân viên AI phải tuân theo ngôn ngữ giao diện hiện tại. Tool và Skill có thể dùng tệp locale riêng của plugin thông qua `introduction`, còn các trường hồ sơ Nhân viên AI được xử lý theo cách khác.

## Nội dung cần quốc tế hóa

Thông thường, bạn cần quốc tế hóa văn bản hiển thị cho quản trị viên hoặc người dùng:

- `introduction.title` và `introduction.about` của Tool
- `introduction.title` và `introduction.about` của Skill
- Văn bản trong thẻ frontend, modal và nút thao tác

`definition.name`, `definition.description`, mô tả schema, nội dung Skill và system prompt của Nhân viên AI chủ yếu dành cho mô hình. Không thay đổi tên ổn định của Tool hoặc nội dung workflow chỉ để dịch giao diện.

## Dịch văn bản giao diện quản lý của Tool và Skill

`introduction` của Tool có thể dùng mẫu bản dịch `{{t(...)}}`:

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Dùng cùng định dạng trong frontmatter `SKILLS.md` của Skill:

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

Giá trị `ns` phải khớp với namespace quốc tế hóa mà plugin thực sự sử dụng.

## Thêm tệp ngôn ngữ

Tệp locale của plugin được lưu trong `src/locale/`. Dùng cùng các key cho mỗi ngôn ngữ và chỉ thay đổi phần văn bản tương ứng.

### Thêm nội dung tiếng Anh

Thêm nội dung sau vào `src/locale/en-US.json`:

```json
{
  "ai.tools.greetDeveloper.title": "Developer name check",
  "ai.tools.greetDeveloper.about": "Validate the developer name before writing a welcome message.",
  "ai.tools.developerChoice.title": "Developer choices",
  "ai.tools.developerChoice.about": "Ask the developer to choose the next plugin capability.",
  "ai.skills.welcomeDeveloper.title": "Developer welcome",
  "ai.skills.welcomeDeveloper.about": "Welcome a developer and ask what plugin capability they want to build."
}
```

### Thêm nội dung tiếng Trung

Thêm nội dung sau vào `src/locale/zh-CN.json`:

```json
{
  "ai.tools.greetDeveloper.title": "开发者姓名确认",
  "ai.tools.greetDeveloper.about": "在生成欢迎语之前确认开发者姓名。",
  "ai.tools.developerChoice.title": "开发方向选择",
  "ai.tools.developerChoice.about": "让开发者选择下一步要实现的插件能力。",
  "ai.skills.welcomeDeveloper.title": "欢迎开发者",
  "ai.skills.welcomeDeveloper.about": "欢迎开发者，并询问接下来要实现的插件能力。"
}
```

## Giới hạn hiện tại của hồ sơ Nhân viên AI

Các trường `nickname`, `position`, `bio` và `greeting` trong hồ sơ Nhân viên AI không dùng cơ chế mẫu `{{t(...)}}` ở trên. Khi chạy, các nhân viên tích hợp sẵn hiện dịch những chuỗi thô này trong namespace `@nocobase/plugin-ai`, vì vậy plugin bên thứ ba không nên mặc định rằng namespace tùy chỉnh sẽ tự động có hiệu lực.

Nếu không bổ sung logic bản địa hóa riêng, hãy chọn một ngôn ngữ mặc định cho hồ sơ nhân viên và đặt văn bản giao diện của Tool, Skill cùng các tương tác frontend trong tệp locale riêng của plugin.

## Liên kết liên quan

- [Phát triển plugin Nhân viên AI](./index.md) — Quay lại tổng quan hướng dẫn phát triển
- [Định nghĩa Tool phía máy chủ](./define-tool.md) — Dùng mẫu bản dịch trong phần giới thiệu Tool
- [Định nghĩa Skill](./define-skill.md) — Dùng mẫu bản dịch trong frontmatter của Skill
- [Định nghĩa Nhân viên AI tích hợp sẵn](./define-ai-employee.md) — Tìm hiểu các trường hồ sơ nhân viên
- [Thêm tương tác frontend cho Tool](./frontend-tool-ui.md) — Thêm bản dịch giao diện cho thẻ và modal frontend
