:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# FlowEngine là gì?

FlowEngine là một công cụ phát triển giao diện người dùng (frontend) không mã, ít mã mới được NocoBase 2.0 ra mắt. Nó kết hợp các mô hình (Model) với các luồng (Flow) để đơn giản hóa logic frontend, nâng cao khả năng tái sử dụng và bảo trì. Đồng thời, nhờ khả năng cấu hình của Flow, nó cung cấp khả năng cấu hình và điều phối không mã cho các thành phần frontend và logic nghiệp vụ.

## Tại sao lại gọi là FlowEngine?

Bởi vì trong FlowEngine, các thuộc tính và logic của thành phần không còn được định nghĩa tĩnh, mà được điều khiển và quản lý bởi một **luồng (Flow)**.

*   **Flow**, giống như một luồng dữ liệu, phân tách logic thành các bước (Step) có thứ tự và áp dụng chúng tuần tự cho thành phần;
*   **Engine** thể hiện đây là một công cụ điều khiển logic và tương tác frontend.

Vì vậy, **FlowEngine = Một công cụ logic frontend được điều khiển bởi các luồng**.

## Model là gì?

Trong FlowEngine, Model là một mô hình trừu tượng của thành phần, chịu trách nhiệm:

*   Quản lý **thuộc tính (Props) và trạng thái** của thành phần;
*   Định nghĩa **phương thức hiển thị** của thành phần;
*   Chứa và thực thi **Flow**;
*   Xử lý thống nhất **phân phối sự kiện** và **vòng đời**.

Nói cách khác, **Model là bộ não logic của thành phần**, biến thành phần từ một yếu tố tĩnh thành một đơn vị động có thể cấu hình và điều phối.

## Flow là gì?

Trong FlowEngine, **Flow là một luồng logic phục vụ Model**.
Mục đích của nó là:

*   Phân tách logic thuộc tính hoặc sự kiện thành các bước (Step) và thực thi chúng tuần tự theo kiểu luồng;
*   Có thể quản lý các thay đổi thuộc tính cũng như phản hồi sự kiện;
*   Làm cho logic trở nên **động, có thể cấu hình và tái sử dụng**.

## Làm thế nào để hiểu các khái niệm này?

Bạn có thể hình dung **Flow** như một **dòng nước**:

*   **Step giống như một nút trên đường đi của dòng nước**
    Mỗi Step thực hiện một nhiệm vụ nhỏ (ví dụ: đặt thuộc tính, kích hoạt sự kiện, gọi API), giống như nước tạo ra tác động khi đi qua một cửa cống hoặc một bánh xe nước.

*   **Dòng chảy có thứ tự**
    Nước chảy theo một con đường định trước từ thượng nguồn xuống hạ nguồn, tuần tự đi qua tất cả các Step; tương tự, logic trong một Flow được thực thi theo thứ tự đã định.

*   **Dòng chảy có thể phân nhánh và kết hợp**
    Một dòng nước có thể chia thành nhiều dòng nhỏ hơn hoặc hợp nhất lại với nhau; một Flow cũng có thể được chia thành nhiều luồng con hoặc kết hợp thành các chuỗi logic phức tạp hơn.

*   **Dòng chảy có thể cấu hình và kiểm soát**
    Hướng và lưu lượng của dòng nước có thể được điều chỉnh bằng cống; phương thức thực thi và các tham số của một Flow cũng có thể được kiểm soát thông qua cấu hình (`stepParams`).

Tóm tắt ví von

*   Một **thành phần** giống như một bánh xe nước cần có dòng nước để quay;
*   **Model** là đế và bộ điều khiển của bánh xe nước này, chịu trách nhiệm nhận nước và điều khiển hoạt động của nó;
*   **Flow** là dòng nước đó, tuần tự đi qua từng Step, khiến thành phần liên tục thay đổi và phản hồi.

Vì vậy, trong FlowEngine:

*   **Flow cho phép logic di chuyển tự nhiên như một dòng nước**;
*   **Model biến thành phần thành vật mang và thực thi dòng nước này**.