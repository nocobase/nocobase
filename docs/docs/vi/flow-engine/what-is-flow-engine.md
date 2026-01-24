:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# FlowEngine là gì?

FlowEngine là một công cụ phát triển front-end không mã/mã thấp hoàn toàn mới, được NocoBase 2.0 giới thiệu. Nó kết hợp Model và Flow để đơn giản hóa logic front-end, nâng cao khả năng tái sử dụng và dễ bảo trì. Đồng thời, nhờ khả năng cấu hình của Flow, FlowEngine mang đến khả năng cấu hình và điều phối không mã cho các thành phần front-end và logic nghiệp vụ.

## Tại sao lại gọi là FlowEngine?

Trong FlowEngine, các thuộc tính và logic của một thành phần không còn được định nghĩa tĩnh nữa, mà được điều khiển và quản lý bởi **Flow**.

*   **Flow**, giống như một luồng dữ liệu, phân tách logic thành các bước (Step) có thứ tự, sau đó áp dụng dần dần lên thành phần.
*   **Engine** thể hiện đây là một công cụ điều khiển logic và tương tác front-end.

Vì vậy, **FlowEngine = Một công cụ logic front-end được điều khiển bởi Flow**.

## Model là gì?

Trong FlowEngine, Model là một mô hình trừu tượng của một thành phần, chịu trách nhiệm:

*   Quản lý **thuộc tính (Props) và trạng thái** của thành phần.
*   Định nghĩa **phương thức hiển thị** của thành phần.
*   Chứa và thực thi **Flow**.
*   Xử lý thống nhất **phân phối sự kiện** và **vòng đời**.

Nói cách khác, **Model là bộ não logic của một thành phần**, biến thành phần từ một đơn vị tĩnh thành một đơn vị động có thể cấu hình và điều phối.

## Flow là gì?

Trong FlowEngine, **Flow là một luồng logic phục vụ Model**.
Mục đích của nó là:

*   Phân tách logic thuộc tính hoặc sự kiện thành các bước (Step) và thực thi chúng tuần tự theo một luồng.
*   Quản lý các thay đổi thuộc tính cũng như phản hồi sự kiện.
*   Làm cho logic trở nên **động, có thể cấu hình và tái sử dụng**.

## Làm thế nào để hiểu các khái niệm này?

Bạn có thể hình dung **Flow** như một **dòng nước**:

*   **Step giống như một nút trên dòng nước**
    Mỗi Step đảm nhận một nhiệm vụ nhỏ (ví dụ: thiết lập thuộc tính, kích hoạt sự kiện, gọi API), giống như dòng nước tạo ra tác động khi đi qua một cái cống hoặc một cối xay nước.

*   **Flow có thứ tự**
    Dòng nước sẽ đi theo một con đường định trước từ thượng nguồn xuống hạ nguồn, lần lượt đi qua tất cả các Step; tương tự, logic trong một Flow sẽ được thực thi theo thứ tự đã định nghĩa.

*   **Flow có thể phân nhánh và kết hợp**
    Một dòng nước có thể chia thành nhiều dòng nhỏ hơn hoặc hợp nhất lại; Flow cũng có thể được chia thành nhiều Flow con, hoặc kết hợp thành các chuỗi logic phức tạp hơn.

*   **Flow có thể cấu hình và kiểm soát**
    Hướng và lưu lượng của dòng nước có thể được điều chỉnh bằng cống nước; phương thức thực thi và các tham số của Flow cũng có thể được kiểm soát thông qua cấu hình (stepParams).

Tóm tắt ví von

*   Một **thành phần** giống như một cối xay nước cần có dòng nước để quay.
*   Một **Model** là đế và bộ điều khiển của cối xay nước này, chịu trách nhiệm tiếp nhận dòng nước và điều khiển hoạt động của nó.
*   Một **Flow** là dòng nước đó, đi qua từng Step theo thứ tự, thúc đẩy thành phần liên tục thay đổi và phản hồi.

Vì vậy, trong FlowEngine:

*   **Flow cho phép logic di chuyển tự nhiên như một dòng nước**.
*   **Model giúp các thành phần trở thành vật mang và thực thi của dòng nước này**.