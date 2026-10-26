---
title: 'Mở rộng'
description: 'Tích hợp và mở rộng chính sách phê duyệt, thao tác, giao diện, thời hạn và thực thi tin cậy.'
---

# Mở rộng

Trang này dành cho lập trình viên và Agent cần nắm ranh giới tích hợp và mở rộng. Về thiết kế nghiệp vụ, hãy bắt đầu với [Tổng quan phê duyệt](./index.md). Với hợp đồng API chi tiết, hãy dùng Skill và phiên bản của plugin phê duyệt đã cài đặt.

## Tích hợp bản ghi và quy trình có sẵn

Một bản ghi yêu cầu xác định toàn bộ quy trình. `defineApproval` định nghĩa các giai đoạn nháp, duyệt, chỉnh sửa, thực thi và kết thúc; `approvalState` bổ sung quy tắc xử lý theo nhóm vào một trạng thái nghiệp vụ. Mỗi lần đi vào sẽ tạo tác vụ cho một vòng mới. Khi trả lại và đi vào lại, tác vụ mới được tạo trong khi các bản ghi trước vẫn được giữ.

Ứng dụng cung cấp runtime vòng đời, bảng nghiệp vụ, lưu trữ vòng đời, dịch vụ tổ chức, API xác thực/phân quyền và giao diện. Migration của plugin cung cấp nơi lưu tác vụ phê duyệt và bằng chứng. Hãy giới hạn các biểu mẫu, chức năng nhập và API có thể trực tiếp thay đổi trạng thái hoặc các trường đã nộp. Các đề xuất như thay đổi hợp đồng nên lưu yêu cầu tách biệt với dữ liệu chính thức.

## Chính sách tổng hợp tùy chỉnh

Các chính sách chuẩn bao gồm quyết định đơn lẻ, tất cả, bất kỳ, phản hồi đầu tiên, tuần tự và theo ngưỡng. Kết quả đặc biệt theo từng mục hoặc kết quả một phần dùng `StagePolicy`: khai báo cách lập kế hoạch tác vụ, các kết quả có thể có và lối ra. Chính sách tính toán kết luận; vòng đời nghiệp vụ thực hiện việc ghi dữ liệu.

## Thao tác và quy tắc phân công tùy chỉnh

Dùng `defineApprovalAction` cho việc bỏ phiếu trắng, trả lại từng mục, nhắc nhở hoặc các thao tác nghiệp vụ khác, và đăng ký tường minh trên các giai đoạn liên quan. Khai báo đầu vào, quyền, phạm vi người nhận, cách hiển thị và câu chữ trong lịch sử, kèm biểu mẫu và kiểm thử. Kiểm tra lại quy tắc trách nhiệm sau khi chuyển giao, thêm người duyệt, chỉ định và phân công lại.

## Nội dung cố định, đầu ra và tái sử dụng ý kiến

`freeze` khai báo các trường đã nộp. Mỗi lần xác nhận mang theo hash của nội dung hiển thị trên trang. Đầu ra của giai đoạn khai báo số tiền, ngày tháng và các giá trị tương tự do người duyệt nhập; hãy ghi chúng cùng trạng thái nghiệp vụ khi đạt kết luận.

Mặc định, khi đi vào lại cần được duyệt lại từ đầu. `reuse: 'unchanged'` chỉ tái sử dụng ý kiến trước đó khi được cho phép tường minh và nội dung được bao phủ, phiên bản quy tắc, danh tính người chịu trách nhiệm cùng các điều kiện khác đều khớp. Tác vụ mới giữ lại bằng chứng gốc.

## Trang và trung tâm phê duyệt

| Hợp đồng                            | Mục đích                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `previewRoute`                      | Xem trước tuyến duyệt trước khi nộp                                            |
| `runViewsFor` / `upcomingStagesFor` | Các vòng hiện tại và trước đây, cùng các giai đoạn sắp tới                           |
| `actionsFor` / `runActionsFor`      | Thao tác trên tác vụ hoặc vòng của người dùng hiện tại                                    |
| `candidatesFor`                     | Ứng viên đủ điều kiện để chuyển giao, thêm người duyệt và các thao tác tương tự |
| `perform` / `performBatch`          | Thao tác đơn lẻ và xử lý hàng loạt với kết quả theo từng mục                |
| `tasksOf`                           | Tổng hợp tác vụ; API vẫn cần phân quyền nghiệp vụ                   |

`approval-ui` của UI Library cung cấp các component tiến độ, dòng thời gian, xem trước tuyến duyệt, thanh thao tác, nhánh và biên nhận. Agent ánh xạ dữ liệu từ server vào các component này; biểu mẫu và trang nghiệp vụ thuộc về ứng dụng. Trung tâm phê duyệt có thể bao gồm các nguồn công việc khác, mỗi nguồn tự phân quyền đọc và thao tác.

Các trang quản trị cũng thuộc về ứng dụng. Truy vấn yêu cầu, tác vụ và bản ghi thực thi trong phạm vi nghiệp vụ của quản trị viên, và cung cấp chức năng chỉ định, phân công lại đã được cấp quyền. Điều phối lại hoặc đặt lại quy trình cần có lối ra khôi phục nghiệp vụ và quy tắc cho các vòng trước; sau đó Agent mới triển khai API và trang quản trị. Sửa trực tiếp trường trạng thái không thay thế được các thao tác vòng đời.

## Thông báo, thời hạn và thực thi tin cậy

Ứng dụng định kỳ gọi `ApprovalService.sweep()` để nhắc nhở, chuyển cấp và hết hạn nhận việc. `calendar` có thể cung cấp thời gian làm việc. Hãy kết nối các lần quét với tác vụ nền của vòng đời; thông báo và lời gọi ra bên ngoài chỉ thực thi sau khi transaction được commit. Ý kiến một phần chỉ cập nhật tác vụ phê duyệt. Kết luận cuối cùng, trạng thái nghiệp vụ và tác vụ của giai đoạn tiếp theo dùng chung một transaction.

Việc giữ chỗ/giải phóng tài nguyên và kiểm tra phiên bản dữ liệu chính thức thuộc về transaction nghiệp vụ. Thanh toán, đăng ký và đồng bộ với bên ngoài dùng cơ chế thực thi vòng đời tin cậy với thử lại, lối ra khi thất bại và mã định danh nghiệp vụ ổn định.

## Phiên bản quy tắc, nâng cấp và kiểm thử

Chạy migration của ứng dụng khi nâng cấp, quản lý phiên bản quy tắc một cách tường minh, và giữ lại các giai đoạn và lối ra mà những yêu cầu đang chạy sử dụng. Kiểm thử chính sách tùy chỉnh, quyền thao tác, hoàn tác kết luận, tái sử dụng, yêu cầu lặp lại, đồng thời và thời hạn. Kiểm thử các trường hợp bên ngoài thành công, từ chối tường minh, lỗi tạm thời và kết quả không xác định.

## Tìm ví dụ mở rộng ở đâu

Thư mục `server/action-examples/` trong gói ví dụ phê duyệt chứa các phần mở rộng sau, sử dụng các export công khai của plugin phê duyệt. Chúng không tự động xuất hiện khi cài plugin lõi. Hãy đăng ký tường minh trong `actions` của một giai đoạn nghiệp vụ, đồng thời triển khai biểu mẫu và câu chữ trong lịch sử.

| Ví dụ               | Mục đích                                | Ràng buộc nghiệp vụ                                                   |
| --------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `urge.ts`             | Người nộp đơn nhắc nhở                     | Phân quyền và thời gian chờ; thông báo không thay đổi ý kiến      |
| `remove-signer.ts`    | Gỡ người duyệt đã thêm               | Chỉ gỡ trách nhiệm do chính người thao tác đã thêm, theo cấu hình           |
| `retract.ts`          | Rút lại một ý kiến cá nhân          | Tác vụ gốc giữ nguyên ý kiến; một tác vụ mới nhận phản hồi mới |
| `terminate.ts`        | Kết thúc một vòng                            | Phân quyền tường minh và lối ra kết thúc nghiệp vụ đã khai báo               |
| `extend-due.ts`       | Gia hạn thời hạn                       | Chỉ thay đổi thời hạn; khai báo hỗ trợ xử lý hàng loạt                         |
| `acknowledge.ts`      | Yêu cầu và hoàn tất xác nhận đã biết   | Thao tác hoàn tất đi kèm cho một tác vụ phụ                      |
| `abstain.ts`          | Bỏ phiếu trắng trong hội đồng                   | Tên thao tác riêng; bỏ phiếu trắng không phải là đồng ý                    |
| `return-item.ts`      | Trả lại một dòng chi phí                 | Kết quả theo từng dòng và quy tắc khôi phục                                   |
| `vacation-forward.ts` | Chuyển tiếp phân công của quản lý vắng mặt | Là quy tắc phân công chứ không phải thao tác của người dùng                           |

### Tích hợp một thao tác tùy chỉnh

1. Định nghĩa bằng `defineApprovalAction()`, khai báo người thực hiện, điều kiện chặn, tính khả dụng, cách hiển thị và các hiệu ứng mà `plan()` trả về. Không ghi vào cơ sở dữ liệu trong bước lập kế hoạch.
2. Đăng ký thao tác trên các giai đoạn liên quan. Thao tác kết luận khai báo `outcomes`; vòng đời nghiệp vụ cung cấp các lối ra `approvalOutcome` tương ứng.
3. Với tác vụ bổ sung tài liệu hoặc xác nhận đã biết, hãy đăng ký một thao tác hoàn tất riêng cho người nhận và xác định quyền xem cũng như quyền hoàn tất.
4. Tích hợp phân quyền phía server, kiểm tra đầu vào và `perform()`. Các trang dùng thao tác, ứng viên và cấu hình do server cung cấp.
5. Thêm biểu mẫu và câu chữ cho cả hai ngôn ngữ. Dùng `registerTimelineRenderer()` để hiển thị lịch sử khi cần. Kiểm thử tính khả dụng, từ chối, tác vụ và thay đổi trong lịch sử.

### Phân công và vị trí trách nhiệm

`assignees` tạo một ý kiến cho mỗi người, `subjects` một ý kiến cho mỗi dòng, và `pools` một ý kiến cho mỗi vị trí trách nhiệm. Chỉ chọn đúng một cách. Nếu nhóm pháp chế và nhóm tài chính mỗi bên cho một ý kiến, hãy khai báo hai pool và tổng hợp bằng `all`; đừng coi mọi ứng viên trong nhóm là người bắt buộc phải bỏ phiếu. Một pool chỉ có một ứng viên vẫn là một vị trí của nhóm.

Quy tắc phân công mặc định kiểm tra trạng thái hoạt động, ủy quyền, loại trừ người nộp đơn, tiêu chuẩn và trách nhiệm trùng lặp. Việc chuyển giao, thêm người duyệt và phân công lại cũng được kiểm tra. Chuyển giao và thêm người duyệt cần có phạm vi người nhận. Thay thế toàn bộ chuỗi phân công đồng nghĩa với việc tự chịu trách nhiệm cho tất cả các ràng buộc này; thông thường nên kết hợp quy tắc nghiệp vụ với các quy tắc mặc định.

### Tính nhất quán và thử lại

Ý kiến cuối cùng, việc đóng vòng, chuyển trạng thái nghiệp vụ và tác vụ của giai đoạn tiếp theo nên dùng chung một transaction. Lời gọi ra bên ngoài thực thi sau khi commit; không thực hiện thanh toán ngân hàng trực tiếp trong transaction phê duyệt. `perform()` dùng một `requestId` ổn định, các lần thử lại giữ nguyên thao tác, danh tính và đối tượng. `performBatch()` trả về thành công hoặc thất bại theo từng mục thay vì dùng một transaction cho tất cả yêu cầu.

Gửi kèm hash của nội dung hiển thị trên trang cùng với ý kiến. Đừng âm thầm lấy hash mới nhất khi người dùng phê duyệt, vì như vậy sẽ che giấu nội dung họ chưa xem. Thay thế tệp đính kèm, phiên bản dữ liệu liên quan và dựng lại biểu mẫu trong lịch sử cần thêm lưu trữ nghiệp vụ và hợp đồng kiểm tra.

### Quy tắc thời gian chạy nền

Trong Provider tạo runtime vòng đời, hãy kết nối `createLifecycleJobs()`: `onSweep` gọi `sweep()` của phê duyệt và `prune()` của vòng đời, đồng thời các hiệu ứng cũng chạy qua jobs. Bản thân plugin không khởi động bộ hẹn giờ nào. Ứng dụng production chạy nhiều tiến trình nên dùng kho lưu jobs dùng chung để mỗi tiến trình không chạy một hàng đợi bộ nhớ riêng.

Ví dụ hợp đồng hiện tại cung cấp thời gian làm việc theo UTC+8, thứ Hai–thứ Sáu 09:00–18:00, dùng cho thời hạn của quản lý và hết hạn nhận việc mua hàng, không có bảng ngày lễ. Lần quét trong môi trường thử nghiệm xử lý các tác vụ đã đến hạn; nó không làm thời gian trôi nhanh hơn. Hãy dùng đồng hồ có kiểm soát để kiểm thử chính xác ranh giới hết giờ. Quy tắc tạm dừng chung và thời hạn bàn giao vẫn cần quyết định nghiệp vụ.

Tránh tự duyệt cho người nộp đơn được bật mặc định. Khi phân quyền nghiệp vụ cho phép tự phê duyệt một cách tường minh, hãy đặt `allowSelfApproval: true` trên giai đoạn liên quan, chẳng hạn người phụ trách ngân sách tự xác nhận đơn mua của chính mình trước khi tài chính duyệt độc lập. Điều này cho phép người nộp đơn đủ điều kiện tự quyết định thủ công, kể cả qua ủy quyền; nó không tự động phê duyệt hay bỏ qua giai đoạn, và các quy tắc phân công cùng quyền thao tác khác vẫn áp dụng. Người nộp đơn là danh tính do `applicant(record)` trả về, có thể khác với người nộp hộ. Đừng thay thế toàn bộ chuỗi phân công chỉ để bật chính sách này.
