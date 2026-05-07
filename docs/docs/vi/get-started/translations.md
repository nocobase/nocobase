---
title: "Hướng dẫn đóng góp bản dịch NocoBase"
description: "Đóng góp bản dịch đa ngôn ngữ cho NocoBase: bản địa hóa giao diện hệ thống và Plugin, cấu trúc kho locales, gói ngôn ngữ tùy chỉnh, quy trình cộng tác Crowdin."
keywords: "đóng góp bản dịch, đa ngôn ngữ, bản địa hóa, locales, Crowdin, i18n, quốc tế hóa, NocoBase"
---

# Đóng góp bản dịch

Ngôn ngữ mặc định của NocoBase là tiếng Anh. Hiện tại, ứng dụng chính hỗ trợ tiếng Anh, tiếng Ý, tiếng Hà Lan, tiếng Trung giản thể và tiếng Nhật. Chúng tôi trân trọng mời bạn đóng góp bản dịch cho các ngôn ngữ khác, để Người dùng trên toàn cầu đều có thể tận hưởng trải nghiệm NocoBase tiện lợi hơn.

---

## I. Bản địa hóa hệ thống

### 1. Bản dịch giao diện hệ thống và Plugin

#### 1.1 Phạm vi bản dịch
Chỉ áp dụng cho bản địa hóa giao diện hệ thống NocoBase và các Plugin, không bao gồm các nội dung tùy chỉnh khác (như bảng dữ liệu hoặc Block Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Tổng quan nội dung bản địa hóa
NocoBase dùng Git để quản lý nội dung bản địa hóa. Kho chính là:
https://github.com/nocobase/nocobase/tree/main/locales

Mỗi ngôn ngữ được biểu diễn bằng một file JSON đặt tên theo mã ngôn ngữ (ví dụ de-DE.json, fr-FR.json). Cấu trúc file được tổ chức theo module Plugin, dùng cặp key-value để lưu bản dịch. Ví dụ:

```json
{
  // Plugin client
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...các cặp key-value khác
  },
  "@nocobase/plugin-acl": {
    // Các cặp key-value của Plugin này
  }
  // ...các module Plugin khác
}
```

Khi dịch, vui lòng từng bước chuyển đổi nó thành cấu trúc tương tự như sau:

```json
{
  // Plugin client
  "@nocobase/client": {
    "(Fields only)": "(Chỉ Fields - đã dịch)",
    "12 hour": "12 giờ",
    "24 hour": "24 giờ"
    // ...các cặp key-value khác
  },
  "@nocobase/plugin-acl": {
    // Các cặp key-value của Plugin này
  }
  // ...các module Plugin khác
}
```

#### 1.3 Kiểm thử và đồng bộ bản dịch
- Sau khi hoàn thành bản dịch, vui lòng kiểm thử và xác minh tất cả văn bản hiển thị đúng.
Chúng tôi cũng đã phát hành một plugin xác minh bản dịch — tìm `Locale tester` trong plugin marketplace.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Sau khi cài đặt, sao chép nội dung JSON từ file bản địa hóa tương ứng trong kho git, dán vào đó, sau đó nhấn xác nhận để kiểm chứng nội dung bản dịch có hoạt động không.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Sau khi commit, script hệ thống sẽ tự động đồng bộ nội dung bản địa hóa vào kho mã.

#### 1.4 Plugin bản địa hóa NocoBase 2.0

> **Lưu ý:** Phần này đang được phát triển. Plugin bản địa hóa của NocoBase 2.0 có một số khác biệt so với phiên bản 1.x. Thông tin chi tiết sẽ được cung cấp trong các bản cập nhật sau.

<!-- TODO: Bổ sung thông tin chi tiết về sự khác biệt của plugin bản địa hóa 2.0 -->

## II. Bản địa hóa tài liệu (NocoBase 2.0)

Tài liệu của NocoBase 2.0 áp dụng cấu trúc quản lý mới. File nguồn của tài liệu nằm trong kho chính của NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Cấu trúc tài liệu

Tài liệu dùng [Rspress](https://rspress.dev/) làm trình tạo trang static, hỗ trợ 8 ngôn ngữ. Cấu trúc được tổ chức như sau:

```
docs/
├── docs/
│   ├── en/                    # Tiếng Anh (ngôn ngữ nguồn)
│   ├── cn/                    # Tiếng Trung giản thể
│   ├── ja/                    # Tiếng Nhật
│   ├── de/                    # Tiếng Đức
│   ├── fr/                    # Tiếng Pháp
│   ├── es/                    # Tiếng Tây Ban Nha
│   ├── pt/                    # Tiếng Bồ Đào Nha
│   ├── ru/                    # Tiếng Nga
│   └── public/                # Tài nguyên dùng chung (hình ảnh, v.v.)
├── theme/                     # Theme tùy chỉnh
├── rspress.config.ts          # Cấu hình Rspress
└── package.json
```

### 2.2 Quy trình dịch

1. **Đồng bộ với nguồn tiếng Anh**: Tất cả bản dịch nên dựa trên tài liệu tiếng Anh (`docs/en/`). Khi tài liệu tiếng Anh được cập nhật, bản dịch nên được cập nhật tương ứng.

2. **Chiến lược nhánh**:
   - Dùng nhánh `develop` hoặc `next` làm tham chiếu cho nội dung tiếng Anh mới nhất
   - Tạo nhánh dịch của bạn từ nhánh đích

3. **Cấu trúc file**: Mỗi thư mục ngôn ngữ nên phản chiếu cấu trúc thư mục tiếng Anh. Ví dụ:
   ```
   docs/en/get-started/index.md    →    docs/ja/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/ja/api/acl/acl.md
   ```

### 2.3 Đóng góp bản dịch

1. Fork kho: https://github.com/nocobase/nocobase
2. Clone fork của bạn và checkout nhánh `develop` hoặc `next`
3. Điều hướng đến thư mục `docs/docs/`
4. Tìm thư mục ngôn ngữ bạn muốn đóng góp (ví dụ, tiếng Nhật là `ja/`)
5. Dịch các file markdown, giữ cấu trúc file giống với phiên bản tiếng Anh
6. Kiểm thử thay đổi của bạn ở local:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Submit Pull Request lên kho chính

### 2.4 Hướng dẫn dịch

- **Giữ format nhất quán**: Giữ cấu trúc markdown, tiêu đề, code block và liên kết giống file nguồn
- **Bảo toàn frontmatter**: Giữ nguyên YAML frontmatter ở đầu file, trừ khi nó chứa nội dung có thể dịch
- **Tham chiếu hình ảnh**: Dùng cùng đường dẫn hình ảnh từ `docs/public/` — hình ảnh được dùng chung giữa tất cả các ngôn ngữ
- **Liên kết nội bộ**: Cập nhật liên kết nội bộ để trỏ đến đường dẫn ngôn ngữ chính xác
- **Ví dụ code**: Thông thường, ví dụ code không nên dịch, nhưng comment trong code có thể dịch

### 2.5 Cấu hình điều hướng

Cấu trúc điều hướng của mỗi ngôn ngữ được định nghĩa trong file `_nav.json` và `_meta.json` trong mỗi thư mục ngôn ngữ. Khi thêm trang mới hoặc chương, hãy đảm bảo cập nhật các file cấu hình này.

## III. Bản địa hóa trang chủ chính thức

Các trang và toàn bộ nội dung của trang chủ được lưu tại:
https://github.com/nocobase/website

### 3.1 Bắt đầu và tài nguyên tham khảo

Khi thêm ngôn ngữ mới, vui lòng tham khảo các trang ngôn ngữ hiện có:
- Tiếng Anh: https://github.com/nocobase/website/tree/main/src/pages/en
- Tiếng Trung: https://github.com/nocobase/website/tree/main/src/pages/cn
- Tiếng Nhật: https://github.com/nocobase/website/tree/main/src/pages/ja

![Minh họa bản địa hóa trang chủ](https://static-docs.nocobase.com/20250319121600.png)

Sửa đổi style toàn cục nằm tại:
- Tiếng Anh: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Tiếng Trung: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Tiếng Nhật: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Minh họa style toàn cục](https://static-docs.nocobase.com/20250319121501.png)

Bản địa hóa các component toàn cục của trang chủ nằm tại:
https://github.com/nocobase/website/tree/main/src/components

![Minh họa component trang chủ](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Cấu trúc nội dung và phương pháp bản địa hóa

Chúng tôi áp dụng phương pháp quản lý nội dung kết hợp. Nội dung và tài nguyên tiếng Anh, tiếng Trung và tiếng Nhật được đồng bộ định kỳ từ hệ thống CMS và ghi đè, trong khi các ngôn ngữ khác có thể được chỉnh sửa trực tiếp trong file local. Nội dung local được lưu trong thư mục `content`, được tổ chức như sau:

```
/content
  /articles        # Bài viết blog
    /article-slug
      index.md     # Nội dung tiếng Anh (mặc định)
      index.cn.md  # Nội dung tiếng Trung
      index.ja.md  # Nội dung tiếng Nhật
      metadata.json # Metadata và các thuộc tính bản địa hóa khác
  /tutorials       # Hướng dẫn
  /releases        # Thông tin phát hành
  /pages           # Một số trang static
  /categories      # Thông tin phân loại
    /article-categories.json  # Danh sách phân loại bài viết
    /category-slug            # Chi tiết từng phân loại
      /category.json
  /tags            # Thông tin tag
    /article-tags.json        # Danh sách tag bài viết
    /release-tags.json        # Danh sách tag bản phát hành
    /tag-slug                 # Chi tiết từng tag
      /tag.json
  /help-center     # Nội dung trung tâm trợ giúp
    /help-center-tree.json    # Cấu trúc điều hướng trung tâm trợ giúp
  ....
```

### 3.3 Hướng dẫn dịch nội dung

- Về dịch nội dung Markdown

1. Tạo file ngôn ngữ mới dựa trên file mặc định (ví dụ, `index.md` thành `index.fr.md`)
2. Thêm thuộc tính bản địa hóa vào các trường tương ứng trong file JSON
3. Giữ tính nhất quán của cấu trúc file, liên kết và tham chiếu hình ảnh

- Dịch nội dung JSON
Nhiều metadata nội dung được lưu trong file JSON, thường chứa các trường đa ngôn ngữ:

```json
{
  "id": 123,
  "title": "English Title",       // Tiêu đề tiếng Anh (mặc định)
  "title_cn": "中文标题",          // Tiêu đề tiếng Trung
  "title_ja": "日本語タイトル",    // Tiêu đề tiếng Nhật
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // Đường dẫn URL (thường không dịch)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Lưu ý khi dịch:**

1. **Quy ước đặt tên trường**: Các trường dịch thường dùng format `{trường gốc}_{mã ngôn ngữ}`
   - Ví dụ: title_fr (tiêu đề tiếng Pháp), description_de (mô tả tiếng Đức)

2. **Khi thêm ngôn ngữ mới**:
   - Thêm phiên bản có hậu tố ngôn ngữ tương ứng cho mỗi trường cần dịch
   - Không sửa giá trị trường gốc (như title, description, v.v.), vì chúng đóng vai trò là nội dung ngôn ngữ mặc định (tiếng Anh)

3. **Cơ chế đồng bộ CMS**:
   - Hệ thống CMS định kỳ cập nhật nội dung tiếng Anh, tiếng Trung và tiếng Nhật
   - Hệ thống chỉ cập nhật/ghi đè nội dung của ba ngôn ngữ này (một số thuộc tính trong JSON), **không xóa** các trường ngôn ngữ do người đóng góp khác thêm vào
   - Ví dụ: nếu bạn đã thêm bản dịch tiếng Pháp (title_fr), việc đồng bộ CMS sẽ không ảnh hưởng đến trường này


### 3.4 Cấu hình hỗ trợ ngôn ngữ mới

Để thêm hỗ trợ cho ngôn ngữ mới, cần sửa cấu hình `SUPPORTED_LANGUAGES` trong file `src/utils/index.ts`:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Ví dụ thêm ngôn ngữ mới:
  fr: {
    code: 'fr',
    locale: 'fr-FR',
    name: 'French'
  }
};
```

### 3.5 File layout và style

Mỗi ngôn ngữ cần file layout tương ứng:

1. Tạo file layout mới (ví dụ, đối với tiếng Pháp, tạo `src/layouts/BaseFR.astro`)
2. Bạn có thể sao chép file layout hiện có (như `BaseEN.astro`) và dịch nó
3. File layout chứa bản dịch của các phần tử toàn cục như menu điều hướng, footer, v.v.
4. Đảm bảo cập nhật cấu hình language switcher để chuyển đổi đúng sang ngôn ngữ mới được thêm

### 3.6 Tạo thư mục trang ngôn ngữ

Tạo thư mục trang riêng cho ngôn ngữ mới:

1. Tạo một thư mục đặt tên theo mã ngôn ngữ trong thư mục `src` (ví dụ `src/fr/`)
2. Sao chép cấu trúc trang từ thư mục ngôn ngữ khác (ví dụ `src/en/`)
3. Cập nhật nội dung trang, dịch tiêu đề, mô tả và văn bản sang ngôn ngữ đích
4. Đảm bảo trang dùng component layout đúng (ví dụ `.layout: '@/layouts/BaseFR.astro'`)

### 3.7 Bản địa hóa component

Một số component dùng chung cũng cần dịch:

1. Kiểm tra các component trong thư mục `src/components/`
2. Đặc biệt chú ý đến các component có văn bản cố định (như navbar, footer, v.v.)
3. Component có thể dùng conditional rendering để hiển thị nội dung của các ngôn ngữ khác nhau:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/fr') && <p>Contenu français</p>}
```

### 3.8 Kiểm thử và xác minh

Sau khi hoàn thành bản dịch, hãy kiểm thử toàn diện:

1. Chạy website ở local (thường dùng `yarn dev`)
2. Kiểm tra hiệu ứng hiển thị của tất cả các trang trong ngôn ngữ mới
3. Xác minh tính năng chuyển đổi ngôn ngữ có hoạt động đúng không
4. Đảm bảo tất cả liên kết trỏ đến trang phiên bản ngôn ngữ chính xác
5. Kiểm tra layout responsive, đảm bảo văn bản đã dịch không phá vỡ thiết kế trang

## IV. Cách bắt đầu dịch

Nếu bạn muốn đóng góp bản dịch ngôn ngữ mới cho NocoBase, vui lòng làm theo các bước sau:

| Component | Kho | Nhánh | Ghi chú |
|------|------|------|------|
| Giao diện hệ thống | https://github.com/nocobase/nocobase/tree/main/locales | main | File JSON bản địa hóa |
| Tài liệu (2.0) | https://github.com/nocobase/nocobase | develop / next | Thư mục `docs/docs/<lang>/` |
| Trang chủ chính thức | https://github.com/nocobase/website | main | Xem phần III |

Sau khi hoàn thành bản dịch, vui lòng submit Pull Request lên NocoBase. Ngôn ngữ mới sẽ xuất hiện trong cấu hình hệ thống, cho phép bạn chọn ngôn ngữ hiển thị.

![Minh họa kích hoạt ngôn ngữ](https://static-docs.nocobase.com/20250319123452.png)

## Tài liệu NocoBase 1.x

Về hướng dẫn dịch của NocoBase 1.x, vui lòng tham khảo:

https://docs-cn.nocobase.com/welcome/community/translations
