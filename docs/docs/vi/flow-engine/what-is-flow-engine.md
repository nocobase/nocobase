---
title: "FlowEngine là gì"
description: "FlowEngine là engine phát triển no-code/low-code frontend của NocoBase 2.0, kết hợp Model và Flow, đơn giản hóa logic frontend và khả năng cấu hình điều phối, hiểu các khái niệm cốt lõi Flow, Step, Engine."
keywords: "FlowEngine,No-code,Low-code,FlowModel,Flow,Step,Engine frontend,Có thể điều phối,NocoBase"
---

# FlowEngine là gì?

FlowEngine là engine phát triển no-code, low-code frontend hoàn toàn mới được giới thiệu trong NocoBase 2.0. Nó kết hợp Model và Flow, đơn giản hóa logic frontend, nâng cao tính tái sử dụng và khả năng bảo trì; đồng thời, thông qua khả năng cấu hình của Flow, mang lại khả năng cấu hình và điều phối no-code cho các component frontend và logic nghiệp vụ.

## Tại sao gọi là FlowEngine?

Bởi vì trong FlowEngine, thuộc tính và logic của component không còn được định nghĩa tĩnh nữa, mà được điều khiển và quản lý thông qua **Flow**.

* **Flow** giống như luồng dữ liệu, phân tách logic thành các bước (Step) có thứ tự, tác động dần lên component;
* **Engine** thể hiện đây là một engine điều khiển logic và tương tác frontend.

Vì vậy, **FlowEngine = engine logic frontend được điều khiển bởi luồng**.

## Model là gì?

Trong FlowEngine, Model là model trừu tượng của component, chịu trách nhiệm:

* Quản lý **thuộc tính (Props) và trạng thái** của component;
* Định nghĩa **cách render** của component;
* Mang theo và thực thi **Flow**;
* Xử lý thống nhất **phân phối sự kiện** và **vòng đời**.

Nói cách khác, **Model là bộ não logic của component**, biến component từ tĩnh thành đơn vị động có thể cấu hình, có thể điều phối.

## Flow là gì?

Trong FlowEngine, **Flow là luồng logic phục vụ cho Model**.
Vai trò của nó là:

* Phân tách logic thuộc tính hoặc sự kiện thành các bước (Step), thực thi tuần tự theo cách của luồng;
* Có thể quản lý thay đổi thuộc tính, cũng có thể quản lý phản hồi sự kiện;
* Khiến logic trở nên **động hóa, có thể cấu hình hóa, có thể tái sử dụng**.

## Làm sao để hiểu các khái niệm này?

Có thể tưởng tượng **Flow** như một **dòng nước**:

* **Step giống như các nút mà dòng nước đi qua**
  Mỗi Step đảm nhận một nhiệm vụ nhỏ (ví dụ thiết lập thuộc tính, kích hoạt sự kiện, gọi interface), giống như khi dòng nước đi qua một cánh cửa nước hoặc bánh xe nước nào đó sẽ tạo ra tác dụng tương ứng.

* **Luồng có thứ tự**
  Dòng nước sẽ đi theo đường đã định từ thượng nguồn đến hạ nguồn, qua từng Step; tương tự, logic trong Flow sẽ thực thi theo thứ tự đã định nghĩa.

* **Luồng có thể phân nhánh và kết hợp**
  Một dòng nước có thể chia thành nhiều dòng nhỏ, cũng có thể hội tụ lại; Flow cũng có thể tách thành nhiều luồng con, hoặc kết hợp thành chuỗi logic phức tạp hơn.

* **Luồng có thể cấu hình và kiểm soát**
  Hướng và lưu lượng của dòng nước có thể được điều chỉnh thông qua cửa nước; cách thức thực thi và tham số của Flow cũng có thể được kiểm soát thông qua cấu hình (stepParams).

Tóm tắt phép ẩn dụ

* **Component** giống như một bánh xe nước, cần có dòng nước đẩy mới có thể quay;
* **Model** là đế và bộ điều khiển của bánh xe nước này, chịu trách nhiệm tiếp nhận dòng nước và điều khiển vận hành;
* **Flow** là dòng nước đó, đi qua từng Step theo thứ tự, đẩy component thay đổi và phản hồi liên tục.

Vì vậy trong FlowEngine:

* **Flow khiến logic chảy tự nhiên như dòng nước**;
* **Model khiến component trở thành vật thể chứa và thực thi của dòng nước**.
