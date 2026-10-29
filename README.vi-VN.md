# NocoBase 3

> Nhánh này chứa NocoBase 3. Nếu bạn đang tìm nền tảng no-code NocoBase 2, hãy truy cập [NocoBase 2](https://nocode.nocobase.com/).

[English](./README.md) | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | Tiếng Việt | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

**Xây dựng hệ thống nghiệp vụ tin cậy**

NocoBase là nền tảng mã nguồn mở để xây dựng, vận hành và liên tục phát triển hệ thống nghiệp vụ bằng AI. Agent viết code và thực thi công việc, NocoBase cung cấp nền móng và năng lực quản trị, còn con người đưa ra quyết định.

[▶ Xem demo](https://static-docs.nocobase.com/nocobase-3-vi.mp4)

[Trang web](https://www.nocobase.com/vi-VN/) · [Tài liệu](https://docs.nocobase.com/) · [Bắt đầu nhanh](#quick-start) · [Cộng đồng](https://forum.nocobase.com/)

## Vì sao cần NocoBase

**AI viết code rất nhanh. Nhưng xây dựng hệ thống nghiệp vụ tin cậy vẫn không hề dễ.**

Đội ngũ của bạn đã phát triển với AI hoặc vibe coding. Code được viết rất nhanh, nhưng vấn đề mới cũng nảy sinh.

- **Nền móng phải xây từ đầu**

  Dù AI viết code, việc thiết kế phân quyền, workflow engine và phê duyệt từ đầu vẫn rất khó. Nhiều trường hợp biên, khối lượng bảo trì lớn.

- **Kiến trúc trôi dạt, dần mất kiểm soát**

  Đổi người, đổi model, thậm chí đổi phiên làm việc, AI đều có thể làm theo một cách khác. Hệ thống ngày càng khó bảo trì.

- **Việc song song quá nhiều, người duyệt không xuể**

  Bạn xử lý nhiều dự án và tác vụ cùng lúc, chuyển qua lại giữa các terminal và cuộc trò chuyện, trong khi agent gửi về ngày càng nhiều thay đổi. Không ai xem hết được, nhưng buông tay thì quá rủi ro.

- **Tri thức và kinh nghiệm khó lưu giữ, khó chia sẻ**

  Bối cảnh yêu cầu, tài liệu nghiệp vụ và kinh nghiệm dự án nằm rải rác trong các cuộc trò chuyện trên nhiều máy khác nhau. Đổi người hay đổi agent là khó tìm lại.

<a id="quick-start"></a>

## Bắt đầu nhanh

Yêu cầu Node.js 24+ và pnpm 11. Người dùng Windows hãy sử dụng WSL. Các ví dụ dùng SQLite nên không cần máy chủ cơ sở dữ liệu riêng.

### Sử dụng Coding Agent

Mở Coding Agent hỗ trợ Skills trong một thư mục trống và cài đặt Skill tạo ứng dụng:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Chọn Agent của bạn khi cài đặt. Nếu Agent chưa nhận diện Skill mới, hãy mở phiên mới. Sau đó gửi:

```text
Làm theo Skill nocobase-create-app để tạo và khởi chạy ứng dụng NocoBase 3 trong thư mục trống hiện tại, sử dụng mẫu mặc định và SQLite.
```

### Sử dụng terminal

Chạy các lệnh sau từ thư mục cha nơi bạn lưu các dự án:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Xem [tài liệu](https://docs.nocobase.com/) để biết thêm các bước thiết lập và hướng dẫn phát triển.

## Hệ sinh thái NocoBase

- **[NocoBase Core](https://www.nocobase.com/vi-VN/core/)**

  **Để agent tập trung vào logic nghiệp vụ. Nền móng đã sẵn sàng.**

  NocoBase Core là nền móng ứng dụng mã nguồn mở cho hệ thống nghiệp vụ được xây dựng và vận hành bằng AI. Phân quyền, workflow, tệp tin và các khối chức năng khác đều có sẵn, nên agent chỉ cần phát triển phần nghiệp vụ riêng của bạn, trên một kiến trúc thống nhất.

- **[NocoBase Studio](https://www.nocobase.com/vi-VN/studio/)**

  **Agent tự thúc đẩy công việc. Đội ngũ làm chủ toàn cục.**

  NocoBase Studio là nền tảng quản trị cho con người và agent cùng phát triển phần mềm. Studio kết nối Claude Code, Codex, OpenCode thành một đội agent tự thúc đẩy công việc. Tiến độ rõ ràng trong nháy mắt, còn quyết định then chốt do con người đưa ra.

- **[NocoBase Solution](https://www.nocobase.com/vi-VN/solutions/)**

  **Ứng dụng nghiệp vụ mã nguồn mở. Vận hành bằng AI, dùng được ngay.**

  NocoBase Solution là dòng ứng dụng nghiệp vụ do agent vận hành, xây dựng trên Core. Agent làm phần lớn công việc thực thi, con người chỉ đưa ra các quyết định then chốt.

## Cộng đồng và đóng góp

- Đặt câu hỏi và chia sẻ kinh nghiệm trên [diễn đàn cộng đồng](https://forum.nocobase.com/).
- Báo lỗi có thể tái hiện và đề xuất cải tiến qua [GitHub Issues](https://github.com/nocobase/nocobase/issues).
- Đọc [tài liệu](https://docs.nocobase.com/) để tìm hiểu framework và plugin.

Chúng tôi hoan nghênh mọi đóng góp. Trước khi thay đổi kho mã này, hãy đọc [AGENTS.md](./AGENTS.md) và hướng dẫn phát triển liên quan.
