---
title: "Component chuẩn và mở rộng"
description: "Nền component dựa trên shadcn/ui của AI Portal, cùng cơ chế mở rộng cài xong là dùng được — mỗi extension một thư mục, tự động phát hiện và tự động nạp."
keywords: "AI Portal,shadcn/ui,Component,Extension,AppExtension,Registry,Tailwind CSS"
---

# Component chuẩn và mở rộng

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã chạy được Portal đầu tiên theo [Bắt đầu nhanh với AI Portal](./index.md).

:::

Giao diện của Portal gồm hai phần: `src/components/ui` cung cấp component nền, còn `src/extensions` chứa các module nghiệp vụ. Trang này nói về cách dùng hai phần đó.

## Nền component

Dưới `src/components/ui` có hơn 60 component [shadcn/ui](https://ui.shadcn.com/) — nút, biểu mẫu, hộp thoại, drawer, bảng, biểu đồ, những thứ thường dùng đều có. Phong cách style cấu hình trong `components.json`, icon dùng lucide.

Khác với việc kéo về một thư viện component, **mã nguồn của các component này thuộc về dự án**. Chúng nằm ngay trong repository của bạn, sửa thoải mái, và bản cập nhật từ upstream cũng không tự động ghi đè.

Chính vì vậy, khi tùy chỉnh nên dùng cách kết hợp thay vì sửa thẳng:

```tsx
// Khuyến nghị: bọc thêm một lớp, giữ được khả năng thay thế của component nền
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

Sửa thẳng `src/components/ui/button.tsx` cũng đạt được mục đích, nhưng sau này muốn đồng bộ bản vá lỗi từ upstream sẽ phiền. Khi thực sự cần sửa component nền, hãy đối chiếu với phiên bản upstream trước rồi merge có chọn lọc, đừng ghi đè toàn bộ lên thay đổi cục bộ của mình.

:::warning Lưu ý

Đừng đưa Ant Design, hay các component client của NocoBase dựa trên Ant Design, vào Portal. Hệ thống style của Portal là Tailwind CSS cộng shadcn/ui, dùng lẫn sẽ gây xung đột style. Quy ước này đã được ghi trong `AGENTS.md` của template.

:::

## Cơ chế mở rộng

Chức năng nghiệp vụ được viết thành extension, đặt dưới `src/extensions/`, mỗi module chức năng một thư mục:

```text
src/extensions/
├── nocobase-acl/               Component quyền
├── nocobase-ai/                Năng lực hội thoại AI
├── nocobase-route-surfaces/    Ba dạng vật chứa route: trang, drawer, popup
└── nocobase-users-example/     Ví dụ quản lý người dùng
```

Trong mỗi thư mục có một file `extension.tsx`, export mặc định một `AppExtension`. Template sẽ tự động quét và nạp — **bỏ vào thư mục là có hiệu lực, không cần sửa bất kỳ code đăng ký nào**.

## AppExtension

Một extension có thể cung cấp những thứ sau:

| Field | Mô tả |
| --- | --- |
| `id` | Định danh extension, bắt buộc |
| `priority` | Thứ tự nạp, số nhỏ đứng trước, mặc định 100 |
| `resources` | Định nghĩa resource của Refine, quyết định menu điều hướng và ánh xạ route |
| `routes` | Phần tử route, sẽ được gắn vào cây route của trạng thái đã đăng nhập |
| `Provider` | Provider bọc toàn bộ ứng dụng |
| `AuthRuntimeProvider` | Provider runtime xác thực, có hiệu lực ngay từ trước khi đăng nhập |
| `UserMenuItems` | Thêm mục vào menu người dùng |
| `authAdapters` | Adapter cho các phương thức xác thực |
| `dev` | Resource và route chỉ có hiệu lực ở chế độ phát triển |

Một extension tối giản trông như thế này:

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // Tham gia vào việc kiểm tra quyền bảng dữ liệu của NocoBase
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## Extension tích hợp sẵn

Template có sẵn bốn extension, dùng trực tiếp được, và cũng là tài liệu tham khảo tốt nhất khi viết code mới:

**`nocobase-users-example`** — Module CRUD hoàn chỉnh dựa trên bảng `users` chuẩn của NocoBase, có đủ danh sách, tạo, chỉnh sửa, chi tiết. Khi làm trang mới, hãy cho AI viết theo mẫu này.

**`nocobase-acl`** — Component quyền, gồm `CanAccess`, `AclPage`, `AclRegion`, `AclField`, `RoleSwitcher`.

**`nocobase-route-surfaces`** — Ba dạng vật chứa route: nguyên trang, drawer và popup. Cùng một nội dung vừa mở được như một trang độc lập, vừa bật lên dạng drawer ngay trong trang danh sách, và trạng thái route vẫn đồng bộ đúng.

**`nocobase-ai`** — Đưa năng lực hội thoại AI của NocoBase ra frontend, gồm cửa sổ hội thoại, truyền dữ liệu dạng stream, lịch sử phiên và ngữ cảnh trang. Dùng nó để làm một trợ lý AI ngay trong Portal của bạn.

## Quy tắc tham chiếu

Khi viết extension có hai quy ước về đường dẫn:

- Tham chiếu tới thứ thuộc ứng dụng chủ thì dùng alias `@/`, ví dụ `@/components/ui/button`
- Tham chiếu tương đối bên trong extension thì đừng vượt ra ngoài thư mục của chính nó

Nhờ vậy mỗi extension đều tự chứa, có thể copy nguyên thư mục sang một Portal khác để dùng tiếp.

## Extension chính thức có thể cài thêm

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

Ngoài bốn extension tích hợp sẵn, NocoBase sẽ còn cung cấp một loạt extension chính thức để cài theo nhu cầu. Sau khi cài, mã nguồn sẽ nằm dưới `src/extensions/`, trở thành code thuộc về dự án giống như extension tích hợp sẵn, sửa được và commit cùng ứng dụng.

## Đa ngôn ngữ

Nội dung nằm ở `src/locales/`, template có sẵn tiếng Trung và tiếng Anh. Extension cũng có thể có gói ngôn ngữ riêng: tạo thư mục `locales/` trong thư mục extension rồi import trong `extension.tsx` là được.

## Liên kết liên quan

- [Bắt đầu nhanh với AI Portal](./index.md) — Chạy được entry frontend đầu tiên do AI viết
- [Cấu trúc dự án và công nghệ sử dụng](./project-structure.md) — Quy ước thư mục đầy đủ và các lệnh thường dùng
- [Cộng tác cùng AI Agent để xây dựng](./agent-workflow.md) — Để AI viết module mới theo mẫu extension tích hợp sẵn
