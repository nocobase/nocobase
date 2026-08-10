---
title: "Quy trình làm việc + AI để nhân viên hoàn thành tự động hóa nghiên cứu nền tảng của công ty"
description: "Thông qua các biểu mẫu thông tin công ty, hồ sơ điều tra lý lịch, quy trình làm việc và nhân viên AI, quy trình điều tra lý lịch công ty có thể được tự động kích hoạt, lưu giữ và hỗ trợ để xem xét thủ công."
keywords: "NocoBase, nhân viên AI, quy trình làm việc, nghiên cứu nền tảng công ty, thẩm định, tự động hóa, thực tiễn kinh doanh"
---

# Quy trình làm việc + AI để nhân viên hoàn thành tự động hóa nghiên cứu nền tảng của công ty

Trong NocoBase, bạn có thể biến nghiên cứu cơ bản của công ty thành luồng nhiệm vụ tự động có thể theo dõi. Nhân viên kinh doanh vẫn làm việc trên trang thông tin quen thuộc của công ty, trong khi nhân viên quy trình làm việc và AI chịu trách nhiệm hoàn thiện thông tin cơ bản, ghi lại quá trình xử lý và lưu từng báo cáo được tạo.

![](https://static-docs.nocobase.com/202607121806356.png)

Kịch bản này phù hợp để giải quyết một vấn đề phổ biến: thông tin cơ bản về công ty không phải là trường tĩnh kết thúc sau khi được nhập một lần. Thông tin công khai sẽ thay đổi, các sự kiện pháp lý sẽ xảy ra và trạng thái hợp tác sẽ liên tục được điều chỉnh khi hoạt động kinh doanh phát triển. Nếu chỉ dựa vào việc ghi bổ sung thủ công một cách thường xuyên sẽ rất dễ bỏ sót; nếu bạn trực tiếp để AI che đậy thông tin công ty, sẽ khó giải thích "phán quyết này diễn ra như thế nào". Cách tiếp cận ở đây là tách và lưu dữ liệu hiện tại cũng như quy trình nghiên cứu - hồ sơ công ty lưu phiên bản đang được nhân viên kinh doanh sử dụng và hồ sơ kiểm tra lý lịch lưu trạng thái, đầu ra và lịch sử của từng cuộc khảo sát AI.

## Trước tiên hãy nhìn vào hai bảng

Mẫu thông tin công ty cung cấp thông tin cơ bản của đối tượng nghiên cứu và mẫu hồ sơ điều tra lý lịch có trách nhiệm thực hiện từng nhiệm vụ nghiên cứu. Một cái lưu thông tin hiện có và cái còn lại lưu quá trình xử lý và kết quả lịch sử.

### `companies`: Bảng thông tin công ty

| Các lĩnh vực cốt lõi               | tác dụng                                                           |
| ---------------------- | -------------------------------------------------------------- |
| Company name           | Thông tin nhận dạng chính của đối tượng nghiên cứu.                                   |
| Website                | Cung cấp manh mối trang web chính thức để giảm thiểu những đánh giá sai lầm do các công ty trùng tên hoặc viết tắt gây ra.                   |
| Address                | Hỗ trợ xác định khu vực, đơn vị và phạm vi kinh doanh.                                 |
| Company type           | Đánh dấu các mối quan hệ kinh doanh như khách hàng, nhà cung cấp, đối tác,… để thuận tiện cho việc đánh giá và ưu tiên theo dõi sau này. |
| Background information | Lưu báo cáo cơ bản về công ty bạn hiện đang sử dụng và sử dụng Markdown để hiển thị nội dung có cấu trúc. |

### `background_check_tasks`: Biểu mẫu hồ sơ kiểm tra lý lịch

| Các lĩnh vực cốt lõi                  | tác dụng                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Company ID / Company name | Ghi lại cuộc khảo sát này dành cho công ty nào để tạo điều kiện thuận lợi cho việc thực hiện nhiệm vụ và xem xét lịch sử.                                 |
| Status                    | Luồng tác vụ đánh dấu từ `pending` đến `processing` và `completed` cũng là cơ sở để ngăn chặn việc kích hoạt lặp lại. |
| Research report           | Lưu báo cáo nghiên cứu hoàn chỉnh do AI tạo ra lần này.                                                   |
| Summary                   | Lưu bản tóm tắt của AI về quá trình nghiên cứu, các điểm rủi ro và thông tin cần bổ sung.                                     |
| Previous background       | Lưu lại bản cũ trước khi viết lại, hỗ trợ theo dõi lịch sử và so sánh báo cáo cũ và mới.                                   |

![](https://static-docs.nocobase.com/202607121807627.png)

## Nhập quá trình nghiên cứu từ thông tin công ty

Danh sách công ty là lối vào quen thuộc nhất của giới kinh doanh. Bạn có thể xem tên công ty, trang web chính thức, loại công ty, người liên hệ, email và các thông tin khác trên trang. Sau khi vào công ty, nhân viên kinh doanh có thể xem báo cáo lý lịch hiện tại hoặc bắt đầu một cuộc điều tra lý lịch mới.

Sau khi vào trang chỉnh sửa, "Thông tin cơ bản" được hiển thị bằng thành phần chỉnh sửa Markdown. Nội dung do AI tạo ra không phải là một bản tóm tắt ngắn mà là một báo cáo có cấu trúc có thể đọc, sao chép và tiếp tục được duy trì. Nhân viên kinh doanh vẫn có thể sửa đổi thủ công nhưng mỗi kết quả do AI tạo ra sẽ để lại lịch sử tương ứng trong hồ sơ kiểm tra lý lịch.

![](https://static-docs.nocobase.com/202607121807450.png)

Bằng cách này, trang này vẫn trông giống như giao diện bảo trì dữ liệu của công ty thông thường và phương pháp xử lý cơ bản đã trở thành "dữ liệu hiện tại + lịch sử nghiên cứu". Bảng công ty lưu phiên bản hiện tại và bảng nhiệm vụ lưu quy trình và chuỗi bằng chứng.

## Ba phương pháp kích hoạt

![](https://static-docs.nocobase.com/202607121807495.png)

Nghiên cứu cơ bản không nên chỉ dựa vào nút thủ công. Trong kinh doanh thực tế, bạn có thể muốn tự động điền thông tin sau khi thêm công ty mới, bạn cũng có thể cần phải lập hồ sơ lịch sử thường xuyên và bạn cũng có thể chủ động điều tra lại trước khi ký hợp đồng hoặc xem xét.

Quy trình làm việc `New company background check` xử lý nghiên cứu tự động sau khi thêm hoặc cập nhật công ty. Nó lắng nghe các sự kiện dữ liệu của bảng công ty và được kích hoạt khi tên công ty tồn tại và thông tin cơ bản trống. AI sẽ không được gọi ngay sau khi kích hoạt mà trước tiên sẽ kiểm tra xem có nhiệm vụ nào còn dang dở đối với cùng một công ty hay không; nếu không, một bản ghi kiểm tra lý lịch mới sẽ được tạo.

![](https://static-docs.nocobase.com/202607121807374.png)

Quy trình làm việc `Timing company background check` chịu trách nhiệm hoàn thành liên tục dữ liệu lịch sử. Nó chạy 30 phút một lần, truy vấn các công ty có thông tin cơ bản vẫn trống và lặp qua các đợt. Bên trong vòng lặp, chúng tôi cũng kiểm tra xem tác vụ đã tồn tại chưa, sau đó quyết định có tạo tác vụ mới hay không. Bằng cách này, tác vụ đã lên lịch có thể được chạy lặp đi lặp lại mà không tạo ra nhiều bản ghi được xử lý đồng thời do quét nhiều lần.

![](https://static-docs.nocobase.com/202607121807404.png)

Quy trình làm việc của `Manual company background check` được gắn với nút "Chạy kiểm tra lý lịch" trên trang chi tiết công ty, phù hợp để nhân viên kinh doanh chủ động thực hiện khảo sát trước khi truy cập, ký hợp đồng hoặc xem xét. Kích hoạt thủ công và kích hoạt tự động sử dụng cùng một bộ liên kết tiếp theo: bản ghi kiểm tra lý lịch được tạo trước tiên, sau đó quy trình thực thi nhiệm vụ sẽ đảm nhận việc điều tra AI.

![](https://static-docs.nocobase.com/202607121807793.png)

Ba lối vào này giải quyết vấn đề tại các thời điểm khác nhau và cuối cùng được hợp nhất vào cùng một biểu mẫu hồ sơ điều tra lý lịch. Trình kích hoạt mới, trình kích hoạt theo lịch trình và trình kích hoạt thủ công chỉ chịu trách nhiệm ghi lại "nhu cầu điều tra" và việc thực thi cụ thể, quản lý trạng thái và ghi lại kết quả sẽ được chuyển giao cho các quy trình công việc tiếp theo để xử lý thống nhất.

## Biến nghiên cứu AI thành nhiệm vụ

`Do company background check` là quy trình thực sự thực hiện nghiên cứu. Nó lắng nghe bản ghi `pending` trong bảng bản ghi kiểm tra lý lịch. Khi quy trình tự động, theo lịch trình hoặc thủ công trước đó tạo một tác vụ, quy trình làm việc này sẽ được kích hoạt không đồng bộ.

Khi được thực thi, quy trình làm việc trước tiên sẽ truy vấn xem công ty có còn tồn tại hay không. Nếu công ty không tồn tại, nhiệm vụ sẽ kết thúc và bản mô tả sẽ được viết; nếu công ty tồn tại, trạng thái nhiệm vụ sẽ được chuyển sang `processing`, sau đó nhân viên AI sẽ được gọi để tạo báo cáo. Lời nhắc của nhân viên AI yêu cầu đầu ra gồm hai phần: báo cáo Markdown có thể được viết trực tiếp vào trường lý lịch của công ty và phần tóm tắt để xem xét thủ công.

![](https://static-docs.nocobase.com/202607121808833.png)

Sau khi AI trả về các kết quả có cấu trúc, trước tiên, quy trình làm việc sẽ ghi báo cáo, tóm tắt và nội dung cơ bản cũ vào bản ghi kiểm tra lý lịch, sau đó ghi báo cáo mới trở lại bản ghi công ty. Lệnh này tránh được vấn đề "chỉ kết quả mới nhất, không có bản ghi quy trình": trang công ty giữ nội dung mới nhất có sẵn và bản ghi nhiệm vụ giữ lại bối cảnh trước thế hệ này và viết lại.

![](https://static-docs.nocobase.com/202607121808662.png)

Sau khi thực hiện nhiệm vụ, việc xử lý hàng loạt cũng sẽ trở nên tự nhiên hơn. Quy trình làm việc đã lên lịch không cần phải chờ nghiên cứu của từng công ty hoàn thành mà chỉ có trách nhiệm tạo nhiều bản ghi để xử lý; mỗi bản ghi sẽ kích hoạt khảo sát AI một cách độc lập. Nhiều công ty có thể thăng tiến song song và nếu một nhiệm vụ nhất định thất bại hoặc hết thời gian, các công ty khác sẽ không bị chặn.

## Làm cho kết quả AI có thể xem xét được

Các báo cáo do AI tạo được tổ chức theo cấu trúc cố định: hồ sơ công ty, hoạt động kinh doanh cốt lõi, lịch sử phát triển và nền tảng vốn, vị thế thị trường và quan điểm cạnh tranh, đánh giá theo dõi bán hàng và liên kết trích dẫn. Nhân viên kinh doanh không chỉ có thể xem "kết luận" mà còn có thể xem các mẹo rủi ro và thông tin bổ sung do AI đưa ra trong bản tóm tắt.

Trang chi tiết hồ sơ điều tra lý lịch hiển thị "Báo cáo nghiên cứu" và "Nền tảng trước đó" trong các tab và cung cấp thao tác "Sao chép". Bằng cách này, bạn có thể nhanh chóng sao chép báo cáo này trong quá trình thảo luận, đánh giá hoặc liên lạc với bên ngoài và bạn cũng có thể kiểm tra các thay đổi so với phiên bản cũ.

Các chi tiết bản ghi cũng cấu hình hai nhiệm vụ của nhân viên AI. TRONG:

- Cải thiện báo cáo nghiên cứu cơ bản: tạo lại báo cáo sau khi thêm thông tin thông qua đối thoại và ghi lại kết quả vào hồ sơ công ty
- So sánh các báo cáo nghiên cứu cơ bản cũ và mới: Đọc báo cáo cũ và mới và để AI giải thích những khác biệt đáng kể do bản cập nhật này mang lại

Điều này cho phép AI không chỉ dừng lại ở việc “tạo văn bản một lần” mà còn tham gia vào quá trình bảo trì, đánh giá và so sánh phiên bản liên tục.

![](https://static-docs.nocobase.com/202607121808444.png)

## Cách kết hợp quy trình làm việc

Nhìn chung, tập hợp quy trình công việc này có thể được chia thành bốn lớp.

Lớp đầu tiên chịu trách nhiệm tạo các nhiệm vụ. `New company background check` dành cho các công ty mới được thêm hoặc cập nhật, `Timing company background check` dành cho việc hoàn thiện dữ liệu lịch sử và `Manual company background check` dành cho sáng kiến ​​thủ công. Tất cả họ sẽ kiểm tra xem có bản ghi nào chưa hoàn thành trước khi tạo tác vụ hay không, giảm việc xử lý trùng lặp từ nguồn.

Lớp thứ hai chịu trách nhiệm thực hiện các nhiệm vụ. `Do company background check` lắng nghe bản ghi kiểm tra lý lịch, chuyển nhiệm vụ đang chờ xử lý sang xử lý, gọi cho nhân viên AI và viết báo cáo, tóm tắt và các trường lý lịch hiện tại của công ty sau khi hoàn thành.

Lớp thứ ba chịu trách nhiệm cung cấp khả năng ghi lại có kiểm soát cho nhân viên AI. Là quy trình làm việc dựa trên công cụ, `Update company background` hạn chế AI chỉ ghi các bản ghi được chỉ định theo các tham số rõ ràng để tránh sử dụng quá nhiều quyền sửa đổi dữ liệu.

Lớp thứ tư chịu trách nhiệm làm sạch ngoại lệ. `Clean overtime processing background check` chạy 30 phút một lần để dọn dẹp các tác vụ chưa hoàn thành chưa hoàn thành trong hơn 15 phút nhằm tránh việc xử lý các tác vụ trong thời gian dài sau khi bị gián đoạn bất thường.

![](https://static-docs.nocobase.com/202607121808799.png)

## Những kịch bản nào có thể được di chuyển đến?

Những gì cảnh này hiển thị không phải là một biểu mẫu biệt lập hoặc một nút AI riêng biệt mà là sự kết hợp của một số khả năng trong NocoBase: bảng dữ liệu chịu trách nhiệm chứa các đối tượng kinh doanh và hồ sơ lịch sử, trang chịu trách nhiệm xem và kích hoạt bởi nhân viên kinh doanh, quy trình làm việc chịu trách nhiệm lập lịch và ghi lại và nhân viên AI chịu trách nhiệm tạo ra các kết quả có cấu trúc có thể xem xét.

Các mô hình tương tự có thể được chuyển sang các tình huống như tiếp nhận nhà cung cấp, thẩm định khách hàng, đánh giá sơ bộ rủi ro hợp đồng, chấm điểm chất lượng khách hàng tiềm năng, theo dõi dư luận và sàng lọc sơ bộ các mục tiêu đầu tư và tài chính. Miễn là có một số yêu cầu trong doanh nghiệp như "dữ liệu cần phải được hoàn thiện liên tục", "kết quả AI cần được bỏ lại" và "không thể ghi đè các phiên bản lịch sử", thì có thể xây dựng một quy trình tự động có thể chạy, có thể theo dõi và có thể mở rộng theo cách tương tự.

## Tài liệu tham khảo

- [Quy trình làm việc NocoBase](/workflow/)
- [Nhân viên AI của NocoBase](/ai-employees/)
- [Nút nhân viên AI của quy trình làm việc NocoBase ](/ai-employees/workflow/nodes/employee/configuration)
- [Công cụ tùy biến nhân viên NocoBase AI ](/ai-employees/features/tools)
