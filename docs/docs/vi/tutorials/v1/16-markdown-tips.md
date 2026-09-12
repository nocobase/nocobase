# Mẹo dùng Block Markdown

Block Markdown là một trong những Block thường dùng và mạnh mẽ nhất của chúng ta. Từ những gợi ý văn bản nhẹ nhàng đến các kiểu HTML đơn giản, thậm chí có thể đảm nhận logic nghiệp vụ quan trọng, nó đa dạng và linh hoạt về chức năng.

## I. Chức năng cơ bản của Block Markdown

Vì Block Markdown có đặc điểm linh hoạt, công khai và có thể thay đổi bất cứ lúc nào, nó thường được sử dụng để hiển thị thông báo hệ thống. Dù là module nghiệp vụ, chức năng, Block hay Field, chúng ta đều có thể dán những mẹo nhỏ mong muốn lên đó như những mẩu giấy ghi chú nhỏ.

Trước khi sử dụng Block Markdown, bạn nên làm quen với cách trình bày và cú pháp Markdown. Có thể tham khảo [ví dụ Vditor](https://docs.nocobase.com/api/field/markdown-vditor).

> Lưu ý: Block Markdown trong trang khá nhẹ, một số chức năng (như công thức toán học, sơ đồ tư duy, v.v.) tạm thời không được hỗ trợ render. Tuy nhiên, chúng ta có thể sử dụng HTML để thực hiện, hệ thống cũng cung cấp component Field Vditor, mời bạn trải nghiệm.

### 1.1 Ví dụ trang

Chúng ta có thể quan sát cách sử dụng Markdown trên trang "Demo trực tuyến" của hệ thống, cụ thể có thể xem trang chủ, trang đơn hàng và "Thêm ví dụ".

Ví dụ cảnh báo, gợi ý ở trang chủ:
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

Logic tính toán của module đơn hàng:
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

Hướng dẫn và hình ảnh trong các ví dụ khác:
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

Bằng cách chuyển đổi chế độ chỉnh sửa, chúng ta có thể thay đổi nội dung Markdown bất cứ lúc nào và quan sát thay đổi trên trang.
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 Tạo Block Markdown

Trong trang, popup và biểu mẫu, chúng ta đều có thể tạo Block Markdown một cách linh hoạt.

#### Cách tạo

- **Tạo trong popup/trang:**

  ![Block Markdown trong popup/trang](https://static-docs.nocobase.com/20250227091156.png)
- **Tạo trong Block biểu mẫu:**

  ![Block Markdown trong biểu mẫu](https://static-docs.nocobase.com/20250227091309.png)

#### Ví dụ sử dụng

Thông qua cú pháp Markdown nhập `---` có thể mô phỏng đường ngang phân nhóm, đạt được hiệu ứng phân chia nội dung đơn giản, như hình dưới đây:

![Ví dụ phân chia 1](https://static-docs.nocobase.com/20250227092156.png)
![Ví dụ phân chia 2](https://static-docs.nocobase.com/20250227092236.png)

---

## II. Hiển thị nội dung cá nhân hóa

Một ưu điểm khác của Block Markdown là hỗ trợ điền biến hệ thống, giúp tạo ra tiêu đề và thông tin gợi ý cá nhân hóa, từ đó đảm bảo mỗi người dùng đều thấy được thông tin hiển thị riêng biệt trong biểu mẫu của mình.

![Hiển thị cá nhân hóa 1](https://static-docs.nocobase.com/20250227092400.png)
![Hiển thị cá nhân hóa 2](https://static-docs.nocobase.com/20250227092430.png)

Ngoài ra, còn có thể kết hợp dữ liệu biểu mẫu để trình bày nội dung đơn giản, như ví dụ dưới đây:

**Ví dụ tiêu đề nổi bật:**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![Hiệu ứng tiêu đề nổi bật](https://static-docs.nocobase.com/20250227164055.png)

**Ví dụ phân chia căn giữa:**

![Hiệu ứng Field căn giữa](https://static-docs.nocobase.com/20250227164456.png)

## III. Điền nội dung phong phú

Trong khi dần làm quen với cú pháp Markdown và các biến, chúng ta còn có thể điền nội dung phong phú hơn vào Block Markdown, ví dụ như HTML!

### 3.1 Ví dụ HTML

Nếu bạn chưa từng tiếp xúc với cú pháp HTML, có thể nhờ Deepseek viết hộ (lưu ý không hỗ trợ thẻ `script`, khuyến nghị viết tất cả style trong `div` cục bộ).

Dưới đây là một ví dụ thông báo bắt mắt:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Join Us for a Fun Getaway!</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Hi Everyone,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We're excited to invite you to an awesome group outing filled with laughter, adventure, and great vibes!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Mark your calendars for <span style="color: red; font-weight: bold; font-size: 1.5em;">November 10, 2025</span>, and get ready to explore, relax, and enjoy some quality time together.</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We'll share more details about the itinerary and meeting spot soon—stay tuned!</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Can't wait to see you there!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cheers,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Your Event Team</p>
</div>

```

![20250227092832](https://static-docs.nocobase.com/20250227092832.png)

![20250227093003](https://static-docs.nocobase.com/20250227093003.png)

### 3.2 Ví dụ hiệu ứng động

Chúng ta thậm chí có thể kết hợp CSS để tạo các hiệu ứng động đơn giản, tương tự như hiệu ứng hiển thị/ẩn động của slide (hãy thử dán đoạn code sau vào Markdown!):

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">🎉 Special Announcement 🎉</h2>
    <p style="color: #333; font-size: 18px; font-family: 'Georgia', serif;">Thank you for your support and attention! We will hold a special event next Monday, stay tuned!</p>
    <button style="background-color: #d14; color: white; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Click to Learn More</button>
</div>

<style>
@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-20px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>

```

![](https://static-docs.nocobase.com/202502270933fade-out.gif)
