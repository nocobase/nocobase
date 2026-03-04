:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/get-started/translations).
:::

# Đóng góp dịch thuật

Ngôn ngữ mặc định của NocoBase là tiếng Anh. Hiện tại, ứng dụng chính hỗ trợ tiếng Anh, tiếng Ý, tiếng Hà Lan, tiếng Trung giản thể và tiếng Nhật. Chúng tôi trân trọng mời bạn đóng góp bản dịch cho các ngôn ngữ khác, giúp người dùng trên toàn cầu có trải nghiệm NocoBase thuận tiện hơn.

---

## I. Hệ thống bản địa hóa

### 1. Dịch giao diện hệ thống và plugin

#### 1.1 Phạm vi dịch thuật
Chỉ áp dụng cho việc bản địa hóa giao diện hệ thống và plugin của NocoBase, không bao gồm các nội dung tùy chỉnh khác (như bảng dữ liệu hoặc khối Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Tổng quan nội dung bản địa hóa
NocoBase sử dụng Git để quản lý nội dung bản địa hóa. Kho lưu trữ chính là:
https://github.com/nocobase/nocobase/tree/main/locales

Mỗi ngôn ngữ được đại diện bởi một tệp JSON được đặt tên theo mã ngôn ngữ (ví dụ: de-DE.json, fr-FR.json). Cấu trúc tệp được tổ chức theo các mô-đun plugin, sử dụng các cặp khóa-giá trị (key-value) để lưu trữ bản dịch. Ví dụ:

```json
{
  // Plugin phía máy khách (Client plugin)
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...các cặp khóa-giá trị khác
  },
  "@nocobase/plugin-acl": {
    // Các cặp khóa-giá trị cho plugin này
  }
  // ...các mô-đun plugin khác
}
```

Khi dịch, vui lòng chuyển đổi dần sang cấu trúc tương tự như sau:

```json
{
  // Plugin phía máy khách (Client plugin)
  "@nocobase/client": {
    "(Fields only)": "(Chỉ các trường - đã dịch)",
    "12 hour": "12 giờ",
    "24 hour": "24 giờ"
    // ...các cặp khóa-giá trị khác
  },
  "@nocobase/plugin-acl": {
    // Các cặp khóa-giá trị cho plugin này
  }
  // ...các mô-đun plugin khác
}
```

#### 1.3 Kiểm tra và đồng bộ hóa bản dịch
- Sau khi hoàn thành bản dịch, vui lòng kiểm tra và xác nhận tất cả văn bản hiển thị chính xác.
Chúng tôi cũng đã phát hành một plugin kiểm tra bản dịch - tìm kiếm `Locale tester` trong chợ plugin.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Sau khi cài đặt, sao chép nội dung JSON từ tệp bản địa hóa tương ứng trong kho lưu trữ git, dán vào bên trong và nhấn OK để xác minh nội dung bản dịch có hiệu lực hay không.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Sau khi gửi, các kịch bản hệ thống sẽ tự động đồng bộ hóa nội dung bản địa hóa vào kho mã nguồn.

#### 1.4 Plugin bản địa hóa NocoBase 2.0

> **Lưu ý:** Phần này đang trong quá trình phát triển. Plugin bản địa hóa của NocoBase 2.0 có một số khác biệt so với phiên bản 1.x. Thông tin chi tiết sẽ được cung cấp trong các bản cập nhật sau.

<!-- TODO: Thêm chi tiết về sự khác biệt của plugin bản địa hóa 2.0 -->

## II. Bản địa hóa tài liệu (NocoBase 2.0)

Tài liệu cho NocoBase 2.0 được quản lý theo một cấu trúc mới. Các tệp nguồn tài liệu nằm trong kho lưu trữ chính của NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Cấu trúc tài liệu

Tài liệu sử dụng [Rspress](https://rspress.dev/) làm trình tạo trang tĩnh và hỗ trợ 22 ngôn ngữ. Cấu trúc được tổ chức như sau:

```
docs/
├── docs/
│   ├── en/                    # Tiếng Anh (ngôn ngữ nguồn)
│   ├── cn/                    # Tiếng Trung giản thể
│   ├── ja/                    # Tiếng Nhật
│   ├── ko/                    # Tiếng Hàn
│   ├── de/                    # Tiếng Đức
│   ├── fr/                    # Tiếng Pháp
│   ├── es/                    # Tiếng Tây Ban Nha
│   ├── pt/                    # Tiếng Bồ Đào Nha
│   ├── ru/                    # Tiếng Nga
│   ├── it/                    # Tiếng Ý
│   ├── tr/                    # Tiếng Thổ Nhĩ Kỳ
│   ├── uk/                    # Tiếng Ukraina
│   ├── vi/                    # Tiếng Việt
│   ├── id/                    # Tiếng Indonesia
│   ├── th/                    # Tiếng Thái
│   ├── pl/                    # Tiếng Ba Lan
│   ├── nl/                    # Tiếng Hà Lan
│   ├── cs/                    # Tiếng Séc
│   ├── ar/                    # Tiếng Ả Rập
│   ├── he/                    # Tiếng Do Thái
│   ├── hi/                    # Tiếng Hindi
│   ├── sv/                    # Tiếng Thụy Điển
│   └── public/                # Tài nguyên dùng chung (hình ảnh, v.v.)
├── theme/                     # Chủ đề tùy chỉnh
├── rspress.config.ts          # Cấu hình Rspress
└── package.json
```

### 2.2 Luồng công việc dịch thuật

1. **Đồng bộ với nguồn tiếng Anh**: Tất cả bản dịch nên dựa trên tài liệu tiếng Anh (`docs/en/`). Khi tài liệu tiếng Anh được cập nhật, bản dịch cần được cập nhật tương ứng.

2. **Chiến lược nhánh**:
   - Sử dụng nhánh `develop` hoặc `next` làm tham chiếu cho nội dung tiếng Anh mới nhất
   - Tạo nhánh dịch thuật của bạn từ nhánh đích

3. **Cấu trúc tệp**: Mỗi thư mục ngôn ngữ nên phản chiếu cấu trúc thư mục tiếng Anh. Ví dụ:
   ```
   docs/en/get-started/index.md    →    docs/vi/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/vi/api/acl/acl.md
   ```

### 2.3 Đóng góp bản dịch

1. Fork kho lưu trữ: https://github.com/nocobase/nocobase
2. Clone bản fork của bạn và kiểm tra nhánh `develop` hoặc `next`
3. Điều hướng đến thư mục `docs/docs/`
4. Tìm thư mục ngôn ngữ bạn muốn đóng góp (ví dụ: `vi/` cho tiếng Việt)
5. Dịch các tệp markdown, giữ nguyên cấu trúc tệp như phiên bản tiếng Anh
6. Kiểm tra thay đổi cục bộ:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Gửi Pull Request đến kho lưu trữ chính

### 2.4 Hướng dẫn dịch thuật

- **Giữ định dạng nhất quán**: Duy trì cấu trúc markdown, tiêu đề, khối mã và liên kết giống như tệp nguồn
- **Bảo toàn frontmatter**: Giữ nguyên bất kỳ YAML frontmatter nào ở đầu tệp trừ khi nó chứa nội dung có thể dịch được
- **Tham chiếu hình ảnh**: Sử dụng cùng đường dẫn hình ảnh từ `docs/public/` - hình ảnh được chia sẻ giữa tất cả các ngôn ngữ
- **Liên kết nội bộ**: Cập nhật các liên kết nội bộ để trỏ đến đúng đường dẫn ngôn ngữ
- **Ví dụ mã**: Thông thường, các ví dụ mã không nên được dịch, nhưng các chú thích trong mã có thể được dịch

### 2.5 Cấu hình điều hướng

Cấu trúc điều hướng cho mỗi ngôn ngữ được định nghĩa trong các tệp `_nav.json` và `_meta.json` trong mỗi thư mục ngôn ngữ. Khi thêm trang hoặc chương mới, hãy đảm bảo cập nhật các tệp cấu hình này.

## III. Bản địa hóa trang web chính thức

Các trang web và tất cả nội dung được lưu trữ tại:
https://github.com/nocobase/website

### 3.1 Tài nguyên bắt đầu và tham khảo

Khi thêm ngôn ngữ mới, vui lòng tham khảo các trang ngôn ngữ hiện có:
- Tiếng Anh: https://github.com/nocobase/website/tree/main/src/pages/en
- Tiếng Trung: https://github.com/nocobase/website/tree/main/src/pages/cn
- Tiếng Nhật: https://github.com/nocobase/website/tree/main/src/pages/ja

![Minh họa bản địa hóa trang web](https://static-docs.nocobase.com/20250319121600.png)

Các sửa đổi kiểu dáng toàn cục nằm tại:
- Tiếng Anh: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Tiếng Trung: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Tiếng Nhật: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Minh họa kiểu dáng toàn cục](https://static-docs.nocobase.com/20250319121501.png)

Bản địa hóa các thành phần toàn cục của trang web nằm tại:
https://github.com/nocobase/website/tree/main/src/components

![Minh họa thành phần trang web](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Cấu trúc nội dung và phương pháp bản địa hóa

Chúng tôi áp dụng phương pháp quản lý nội dung hỗn hợp. Nội dung và tài nguyên tiếng Anh, tiếng Trung và tiếng Nhật được đồng bộ hóa định kỳ từ hệ thống CMS và bị ghi đè, trong khi các ngôn ngữ khác có thể được chỉnh sửa trực tiếp trong các tệp cục bộ. Nội dung cục bộ được lưu trữ trong thư mục `content`, được tổ chức như sau:

```
/content
  /articles        # Các bài viết blog
    /article-slug
      index.md     # Nội dung tiếng Anh (mặc định)
      index.cn.md  # Nội dung tiếng Trung
      index.ja.md  # Nội dung tiếng Nhật
      metadata.json # Siêu dữ liệu và các thuộc tính bản địa hóa khác
  /tutorials       # Hướng dẫn
  /releases        # Thông tin phát hành
  /pages           # Một số trang tĩnh
  /categories      # Thông tin danh mục
    /article-categories.json  # Danh sách danh mục bài viết
    /category-slug            # Chi tiết danh mục cá nhân
      /category.json
  /tags            # Thông tin thẻ
    /article-tags.json        # Danh sách thẻ bài viết
    /release-tags.json        # Danh sách thẻ phát hành
    /tag-slug                 # Chi tiết thẻ cá nhân
      /tag.json
  /help-center     # Nội dung trung tâm trợ giúp
    /help-center-tree.json    # Cấu trúc điều hướng trung tâm trợ giúp
  ....
```

### 3.3 Hướng dẫn dịch nội dung

- Về dịch nội dung Markdown

1. Tạo tệp ngôn ngữ mới dựa trên tệp mặc định (ví dụ: `index.md` thành `index.vi.md`)
2. Thêm các thuộc tính bản địa hóa vào các trường tương ứng trong tệp JSON
3. Duy trì tính nhất quán trong cấu trúc tệp, liên kết và tham chiếu hình ảnh

- Dịch nội dung JSON
Nhiều siêu dữ liệu nội dung được lưu trữ trong các tệp JSON, thường chứa các trường đa ngôn ngữ:

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

1. **Quy ước đặt tên trường**: Các trường dịch thường sử dụng định dạng `{trường_gốc}_{mã_ngôn_ngữ}`
   - Ví dụ: title_vi (tiêu đề tiếng Việt), description_vi (mô tả tiếng Việt)

2. **Khi thêm ngôn ngữ mới**:
   - Thêm phiên bản hậu tố ngôn ngữ tương ứng cho mỗi trường cần dịch
   - Không sửa đổi giá trị trường gốc (như title, description...), vì chúng đóng vai trò là nội dung ngôn ngữ mặc định (tiếng Anh)

3. **Cơ chế đồng bộ CMS**:
   - Hệ thống CMS cập nhật định kỳ nội dung tiếng Anh, tiếng Trung và tiếng Nhật
   - Hệ thống sẽ chỉ cập nhật/ghi đè nội dung cho ba ngôn ngữ này (một số thuộc tính trong JSON), và **sẽ không xóa** các trường ngôn ngữ do những người đóng góp khác thêm vào
   - Ví dụ: nếu bạn đã thêm bản dịch tiếng Việt (title_vi), việc đồng bộ CMS sẽ không ảnh hưởng đến trường này


### 3.4 Cấu hình hỗ trợ ngôn ngữ mới

Để thêm hỗ trợ cho ngôn ngữ mới, bạn cần sửa đổi cấu hình `SUPPORTED_LANGUAGES` trong tệp `src/utils/index.ts`:

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
  vi: {
    code: 'vi',
    locale: 'vi-VN',
    name: 'Vietnamese'
  }
};
```

### 3.5 Tệp bố cục và kiểu dáng

Mỗi ngôn ngữ cần các tệp bố cục tương ứng:

1. Tạo tệp bố cục mới (ví dụ: cho tiếng Việt, tạo `src/layouts/BaseVI.astro`)
2. Bạn có thể sao chép một tệp bố cục hiện có (như `BaseEN.astro`) và dịch nó
3. Tệp bố cục chứa các bản dịch cho các thành phần toàn cục như menu điều hướng, chân trang, v.v.
4. Đảm bảo cập nhật cấu hình bộ chuyển đổi ngôn ngữ để chuyển sang ngôn ngữ mới được thêm vào một cách chính xác

### 3.6 Tạo thư mục trang ngôn ngữ

Tạo các thư mục trang độc lập cho ngôn ngữ mới:

1. Tạo một thư mục được đặt tên theo mã ngôn ngữ trong thư mục `src` (ví dụ: `src/vi/`)
2. Sao chép cấu trúc trang từ các thư mục ngôn ngữ khác (ví dụ: `src/en/`)
3. Cập nhật nội dung trang, dịch tiêu đề, mô tả và văn bản sang ngôn ngữ đích
4. Đảm bảo các trang sử dụng đúng thành phần bố cục (ví dụ: `.layout: '@/layouts/BaseVI.astro'`)

### 3.7 Bản địa hóa thành phần

Một số thành phần dùng chung cũng cần được dịch:

1. Kiểm tra các thành phần trong thư mục `src/components/`
2. Đặc biệt chú ý đến các thành phần có văn bản cố định (như thanh điều hướng, chân trang, v.v.)
3. Các thành phần có thể sử dụng kết xuất có điều kiện để hiển thị nội dung bằng các ngôn ngữ khác nhau:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/vi') && <p>Nội dung tiếng Việt</p>}
```

### 3.8 Kiểm tra và xác nhận

Sau khi hoàn thành bản dịch, hãy tiến hành kiểm tra toàn diện:

1. Chạy trang web cục bộ (thường sử dụng `yarn dev`)
2. Kiểm tra cách tất cả các trang hiển thị trong ngôn ngữ mới
3. Xác minh chức năng chuyển đổi ngôn ngữ hoạt động bình thường
4. Đảm bảo tất cả các liên kết trỏ đến đúng phiên bản ngôn ngữ của trang
5. Kiểm tra bố cục đáp ứng (responsive), đảm bảo văn bản dịch không làm hỏng thiết kế trang

## IV. Cách bắt đầu dịch

Nếu bạn muốn đóng góp bản dịch ngôn ngữ mới cho NocoBase, vui lòng làm theo các bước sau:

| Thành phần | Kho lưu trữ | Nhánh | Ghi chú |
|------------|-------------|-------|---------|
| Giao diện hệ thống | https://github.com/nocobase/nocobase/tree/main/locales | main | Các tệp bản địa hóa JSON |
| Tài liệu (2.0) | https://github.com/nocobase/nocobase | develop / next | Thư mục `docs/docs/<lang>/` |
| Trang web chính thức | https://github.com/nocobase/website | main | Xem Phần III |

Sau khi hoàn thành bản dịch, vui lòng gửi Pull Request cho NocoBase. Ngôn ngữ mới sẽ xuất hiện trong cấu hình hệ thống, cho phép bạn chọn ngôn ngữ muốn hiển thị.

![Minh họa kích hoạt ngôn ngữ](https://static-docs.nocobase.com/20250319123452.png)

## Tài liệu NocoBase 1.x

Về hướng dẫn dịch thuật cho NocoBase 1.x, vui lòng tham khảo:

https://docs.nocobase.com/welcome/community/translations