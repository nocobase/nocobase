# Cách dùng biến template Markdown

Các bạn thân mến, chào mừng đến với hướng dẫn này! Trong phần này, chúng ta sẽ học từng bước cách sử dụng Markdown và template engine Handlebars để hiển thị nội dung động. Trước đó trong "Mẹo dùng Block Markdown", bạn đã hiểu cú pháp cơ bản, cách tạo và điền biến, tiếp theo hãy cùng đi sâu vào cách sử dụng nâng cao của biến template.

## 1 Giới thiệu Template Engine [Handlebars](https://docs-cn.nocobase.com/handbook/template-handlebars)

Sau khi bạn tạo Block Markdown, bạn sẽ thấy một tùy chọn "Template Engine" trong cấu hình ở góc trên bên phải, mặc định là Handlebars. Handlebars có thể giúp bạn hiển thị nội dung trang động theo điều kiện, làm cho Markdown cũng có thể phản ứng với thay đổi.

![Sơ đồ template engine](https://static-docs.nocobase.com/20250304011925.png)

### 1.1 Vai trò của Handlebars

Mặc dù Markdown gốc chỉ hỗ trợ hiển thị nội dung tĩnh, nhưng thông qua Handlebars, bạn có thể chuyển đổi nội dung văn bản và kiểu hiển thị động dựa trên điều kiện (như trạng thái, số hoặc tùy chọn). Như vậy, ngay cả khi đối mặt với các tình huống nghiệp vụ thay đổi, trang của bạn vẫn có thể luôn cập nhật hiển thị thông tin chính xác.

## 2 Tình huống ứng dụng thực tế

Bây giờ, chúng ta hãy xem một số tình huống thực tế và thực hiện chúng từng bước.

### 2.1 Xử lý trạng thái đơn hàng

Trong một Demo trực tuyến, chúng ta thường cần hiển thị các thông tin gợi ý khác nhau theo trạng thái đơn hàng. Giả sử bảng dữ liệu đơn hàng của bạn có một Field trạng thái với các trạng thái như sau:

![Field trạng thái đơn hàng](https://static-docs.nocobase.com/20250304091420.png)

Dưới đây là nội dung hiển thị tương ứng với 4 trạng thái:


| Nhãn tùy chọn    | Giá trị | Nội dung hiển thị                                            |
| ---------------- | ------- | ------------------------------------------------------------ |
| Pending Approval | 1       | Đơn hàng đã được gửi, chờ phê duyệt nội bộ.                  |
| Pending Payment  | 2       | Chờ khách hàng thanh toán. Vui lòng theo dõi sát trạng thái đơn hàng. |
| Paid             | 3       | Thanh toán đã được xác nhận, vui lòng tiến hành xử lý tiếp theo. Cố vấn được chỉ định sẽ liên hệ với khách hàng trong vòng 1 giờ. |
| Rejected         | 4       | Đơn hàng không được phê duyệt. Nếu cần, vui lòng xem xét lại và gửi lại. |

Trong trang, chúng ta có thể bắt được giá trị trạng thái đơn hàng, từ đó hiển thị động các thông tin khác nhau. Dưới đây chúng ta sẽ giải thích chi tiết cách sử dụng cú pháp if, else và else if để đạt được chức năng này.

#### 2.1.1 Cú pháp if

Sử dụng điều kiện if, có thể hiển thị nội dung phù hợp với điều kiện. Ví dụ:

```
{{#if điều kiện}}
  <p>Kết quả hiển thị</p>
{{/if}}
```

"Điều kiện" ở đây cần sử dụng cú pháp Handlebars (như eq, gt, lt, v.v.). Hãy thử ví dụ đơn giản này:

```
{{#if (eq 1 1)}}
  <p>Kết quả hiển thị: 1 = 1</p>
{{/if}}
```

Hiệu ứng tham khảo hình dưới:

![Ví dụ if 1](https://static-docs.nocobase.com/20250305115416.png)
![Ví dụ if 2](https://static-docs.nocobase.com/20250305115434.png)

#### 2.1.2 Cú pháp else

Khi điều kiện không thỏa mãn, có thể dùng else để chỉ định nội dung dự phòng. Ví dụ:

```
{{#if (eq 1 2)}}
  <p>Kết quả hiển thị: 1 = 2</p>
{{else}}
  <p>Kết quả hiển thị: 1 ≠ 2</p>
{{/if}}
```

Hiệu ứng như sau:

![Ví dụ else](https://static-docs.nocobase.com/20250305115524.png)

#### 2.1.3 Đánh giá đa điều kiện

Nếu muốn đánh giá theo nhiều điều kiện, có thể sử dụng else if. Code ví dụ:

```
{{#if (eq 1 7)}}
  <p>Kết quả hiển thị: 1 = 7</p>
{{else if (eq 1 5)}}
  <p>Kết quả hiển thị: 1 = 5</p>
{{else if (eq 1 4)}}
  <p>Kết quả hiển thị: 1 = 4</p>
{{else}}
  <p>Kết quả hiển thị: 1 ≠ 7 ≠ 5 ≠ 3</p>
{{/if}}
```

Hình hiệu ứng tương ứng:

![Ví dụ đánh giá đa điều kiện](https://static-docs.nocobase.com/20250305115719.png)

### 2.2 Hiển thị hiệu ứng

Sau khi cấu hình trạng thái đơn hàng, trang sẽ chuyển đổi hiển thị động theo các trạng thái khác nhau. Hãy xem hình dưới:

![Hiệu ứng động trạng thái đơn hàng](https://static-docs.nocobase.com/202503040942-handlebar1.gif)

Code trong trang như sau:

```
{{#if order.status}}
  <div>
    {{#if (eq order.status "1")}}
      <span style="color: orange;">⏳ Pending Approval</span>
      <p>Đơn hàng đã được gửi, chờ phê duyệt nội bộ.</p>
    {{else if (eq order.status "2")}}
      <span style="color: #1890ff;">💳 Pending Payment</span>
      <p>Chờ khách hàng thanh toán. Vui lòng theo dõi sát trạng thái đơn hàng.</p>
    {{else if (eq order.status "3")}}
      <span style="color: #52c41a;">✔ Paid</span>
      <p>Thanh toán đã được xác nhận, vui lòng tiến hành xử lý tiếp theo. Cố vấn được chỉ định sẽ liên hệ với khách hàng trong vòng 1 giờ.</p>
    {{else if (eq order.status "4")}}
      <span style="color: #f5222d;">✖ Rejected</span>
      <p>Đơn hàng không được phê duyệt. Nếu cần, vui lòng xem xét lại và gửi lại.</p>
    {{/if}}
  </div>
{{else}}
  <p class="empty-state">Hiện tại không có đơn hàng cần xử lý.</p>
{{/if}}
```

Hãy thử chuyển đổi trạng thái đơn hàng, quan sát xem nội dung trang có cập nhật theo không, để xác minh code của bạn có chính xác không.

### 2.3 Hiển thị chi tiết đơn hàng

Ngoài việc hiển thị trạng thái đơn hàng, chi tiết đơn hàng (như danh sách chi tiết sản phẩm) cũng là nhu cầu phổ biến. Tiếp theo, chúng ta sẽ sử dụng cú pháp each để thực hiện chức năng này.

#### 2.3.1 Giới thiệu cơ bản về cú pháp each

each được sử dụng để lặp qua danh sách. Ví dụ, đối với mảng [1,2,3], bạn có thể viết như sau:

```
{{#each danh sách}}
  <p>Kết quả hiển thị: {{this}}</p>
  <p>Index: {{@index}}</p>
{{/each}}
```

Trong vòng lặp, {{this}} đại diện cho phần tử hiện tại, {{@index}} đại diện cho index hiện tại.

#### 2.3.2 Ví dụ chi tiết sản phẩm

Giả sử bạn cần hiển thị tất cả thông tin sản phẩm trong đơn hàng, có thể sử dụng code sau:

```
{{#each $nRecord.order_items}}
    <p>{{@index}}</p>
    <p>{{this.id}}</p>
    <p>{{this.price}}</p>
    <p>{{this.quantity}}</p>
    <p>{{this.product.name}}</p>
---
{{/each}}
```

Nếu phát hiện trang không hiện dữ liệu, vui lòng đảm bảo Field chi tiết đơn hàng đã được hiển thị chính xác, nếu không hệ thống sẽ coi phần dữ liệu này là dư thừa và không truy vấn.
![20250305122543_handlebar_each](https://static-docs.nocobase.com/20250305122543_handlebar_each.gif)

Bạn có thể phát hiện tên đối tượng sản phẩm (product.name) chưa được in ra, lý do giống như trên, chúng ta cần hiển thị cả đối tượng sản phẩm
![20250305122543_each2](https://static-docs.nocobase.com/20250305122543_each2.gif)

Sau khi hiển thị xong, chúng ta thiết lập ẩn Field liên kết này trong quy tắc liên động
![20250305122543_hidden_each](https://static-docs.nocobase.com/20250305122543_hidden_each.gif)

### 2.4 Sản phẩm cuối cùng: Danh sách sản phẩm đơn hàng

Sau khi hoàn thành các bước trên, bạn sẽ thực hiện được một template hiển thị danh sách sản phẩm đơn hàng đầy đủ. Vui lòng tham khảo code dưới đây:

```
### Danh sách sản phẩm đơn hàng

{{#if $nRecord.order_items}}
  <div class="cart-summary">Tổng cộng: {{$nRecord.order_items.length}} sản phẩm, tổng giá: ¥{{$nRecord.total}}</div>
  
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Tên sản phẩm</th>
        <th>Đơn giá</th>
        <th>Số lượng</th>
        <th>Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      {{#each $nRecord.order_items}}
        <tr style="{{#if this.out_of_stock}}color: red;{{/if}}">
          <td>{{@index}}</td>
          <td>{{this.product.name}}</td>
          <td>¥{{this.price}}</td>
          <td>{{this.quantity}}</td>
          <td>¥{{multiply this.price this.quantity}}</td>
          <td>
            {{#if this.out_of_stock}}
              <span>Hết hàng</span>
            {{else if this.low_stock}}
              <span style="color:orange;">Sắp hết hàng</span>
            {{/if}}
          </td>
        </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p>Đơn hàng trống</p>
{{/if}}
```

Sau khi chạy, bạn sẽ thấy hiệu ứng như sau:

![Hiệu ứng danh sách sản phẩm đơn hàng](https://static-docs.nocobase.com/20250305124125.png)

Để thể hiện rõ hơn tính linh hoạt của Handlebars, chúng ta đã thêm các Field "Hết hàng" (out_of_stock) và "Sắp hết hàng" (low_stock) vào chi tiết đơn hàng:

- Khi out_of_stock là true, sẽ hiển thị "Hết hàng" và mục sản phẩm chuyển thành màu đỏ.
- Khi low_stock là true, gợi ý "Sắp hết hàng" ở bên phải và sử dụng màu cam.

![Hiệu ứng bổ sung: Hết hàng và sắp hết hàng](https://static-docs.nocobase.com/20250305130258.png)

## 3 Tóm tắt và đề xuất

Qua phần giải thích trên, bạn đã học cách sử dụng Handlebars để render template Markdown động, bao gồm các cú pháp cốt lõi như điều kiện if/else, vòng lặp each. Trong phát triển thực tế, đối với logic phức tạp hơn, khuyến nghị kết hợp với quy tắc liên động, Field tính toán, Workflow hoặc node script để nâng cao tính linh hoạt và khả năng mở rộng.

Hy vọng bạn có thể nắm vững các kỹ thuật này thông qua thực hành và áp dụng linh hoạt trong dự án. Hãy tiếp tục cố gắng, khám phá thêm nhiều khả năng!

---

Nếu gặp bất kỳ vấn đề nào trong quá trình thao tác, mời bạn truy cập [Cộng đồng NocoBase](https://forum.nocobase.com) để trao đổi hoặc xem [tài liệu chính thức](https://docs-cn.nocobase.com). Hy vọng hướng dẫn này có thể giúp bạn thực hiện thành công đăng ký người dùng có duyệt theo nhu cầu thực tế và mở rộng linh hoạt khi cần. Chúc bạn sử dụng thuận lợi, dự án thành công!
