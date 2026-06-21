---
title: "Workflow - Kế hoạch thực thi (lịch sử)"
description: "Kế hoạch thực thi (lịch sử): các trạng thái như đang xếp hàng, đang chạy, hoàn tất, thất bại, lịch sử thực thi và chi tiết."
keywords: "workflow,kế hoạch thực thi,lịch sử thực thi,trạng thái thực thi,lịch sử,NocoBase"
---

# Kế hoạch thực thi (lịch sử)

Sau khi mỗi Workflow được kích hoạt, hệ thống sẽ tạo một kế hoạch thực thi tương ứng để theo dõi quá trình thực thi của tác vụ này. Mỗi kế hoạch thực thi đều có một giá trị trạng thái biểu thị trạng thái thực thi hiện tại, trạng thái này có thể được xem trong cả danh sách lẫn chi tiết của lịch sử thực thi:

![Trạng thái kế hoạch thực thi](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Khi tất cả các Node trong nhánh luồng chính đều thực thi đến điểm kết thúc với trạng thái "Hoàn tất", toàn bộ kế hoạch thực thi sẽ kết thúc với trạng thái "Hoàn tất". Khi các Node trong nhánh luồng chính xuất hiện trạng thái cuối như "Thất bại", "Lỗi", "Hủy", "Từ chối"..., toàn bộ kế hoạch thực thi sẽ **dừng sớm** với trạng thái tương ứng. Khi Node trong nhánh luồng chính xuất hiện trạng thái "Chờ", toàn bộ kế hoạch thực thi sẽ tạm dừng thực thi nhưng vẫn hiển thị trạng thái "Đang chạy", cho đến khi Node đang chờ được tiếp tục thì sẽ chạy tiếp. Các loại Node khác nhau xử lý trạng thái chờ theo cách khác nhau, ví dụ Node thủ công cần chờ xử lý thủ công, còn Node trì hoãn cần chờ đến thời điểm rồi tiếp tục thực thi.

Trạng thái của kế hoạch thực thi như bảng sau:

| Trạng thái   | Trạng thái Node cuối cùng được thực thi trong luồng chính | Ý nghĩa                                             |
| ------ | ---------------------------- | ------------------------------------------------ |
| Đang xếp hàng | -                            | Quy trình đã được kích hoạt và sinh kế hoạch thực thi, đang chờ bộ điều phối sắp xếp thực thi |
| Đang chạy | Chờ                         | Node yêu cầu tạm dừng, chờ đầu vào hoặc callback tiếp theo rồi mới tiếp tục         |
| Hoàn tất   | Hoàn tất                         | Không gặp vấn đề nào, tất cả Node lần lượt được thực thi xong như mong đợi.     |
| Thất bại   | Thất bại                         | Do không thỏa mãn cấu hình Node nên thất bại.                   |
| Lỗi   | Lỗi                         | Node gặp lỗi chương trình chưa được bắt, kết thúc sớm.             |
| Hủy   | Hủy                         | Node đang chờ bị người quản lý quy trình hủy thực thi từ bên ngoài, kết thúc sớm |
| Từ chối   | Từ chối                         | Trong Node xử lý thủ công, bị người dùng từ chối nên không tiếp tục các bước sau   |

Trong ví dụ ở [Bắt đầu nhanh](../getting-started.md), chúng ta đã biết việc xem chi tiết lịch sử thực thi của Workflow có thể giúp kiểm tra xem việc thực thi của tất cả các Node trong quá trình thực thi có bình thường hay không, cũng như trạng thái thực thi và dữ liệu kết quả của từng Node đã được thực thi. Trong một số luồng và Node nâng cao, Node có thể có nhiều kết quả, ví dụ kết quả của Node vòng lặp:

![Kết quả Node được thực thi nhiều lần](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Mẹo}
Workflow có thể được kích hoạt đồng thời nhưng việc thực thi sẽ được xếp hàng và chạy lần lượt. Ngay cả khi nhiều Workflow được kích hoạt cùng lúc, chúng cũng sẽ được thực thi theo thứ tự và không chạy song song. Vì vậy khi xuất hiện tình huống "Đang xếp hàng" tức là có Workflow khác đang thực thi, cần phải chờ.

Trạng thái "Đang chạy" chỉ có nghĩa là kế hoạch thực thi đó đã bắt đầu và thường đang tạm dừng do trạng thái chờ của Node bên trong, không có nghĩa kế hoạch thực thi đó đang chiếm tài nguyên thực thi đầu hàng đợi. Vì vậy khi tồn tại kế hoạch thực thi "Đang chạy", các kế hoạch thực thi "Đang xếp hàng" khác vẫn có thể được điều phối để bắt đầu thực thi.
:::

## Trạng thái thực thi của Node

Trạng thái của kế hoạch thực thi được quyết định bởi việc thực thi từng Node trong đó. Trong một kế hoạch thực thi sau khi được kích hoạt, mỗi Node sau khi thực thi sẽ sinh ra một trạng thái thực thi, và trạng thái sẽ quyết định luồng tiếp theo có tiếp tục thực thi hay không. Thông thường, sau khi Node thực thi thành công sẽ tiếp tục thực thi Node tiếp theo cho đến khi tất cả các Node lần lượt được thực thi xong, hoặc bị gián đoạn. Khi gặp các Node liên quan đến điều khiển luồng như nhánh, vòng lặp, song song, trì hoãn..., sẽ căn cứ vào điều kiện cấu hình của Node và dữ liệu ngữ cảnh khi chạy để quyết định hướng thực thi của Node tiếp theo.

Các trạng thái có thể có sau khi mỗi Node được thực thi như bảng dưới đây:

| Trạng thái | Có phải trạng thái cuối | Có dừng sớm không | Ý nghĩa                                                   |
| ---- | :--------: | :----------: | ------------------------------------------------------ |
| Chờ |     Không     |      Không      | Node yêu cầu tạm dừng, chờ đầu vào hoặc callback tiếp theo rồi mới tiếp tục               |
| Hoàn tất |     Có     |      Không      | Không gặp vấn đề nào, thực thi thành công, tiếp tục thực thi Node tiếp theo cho đến khi kết thúc. |
| Thất bại |     Có     |      Có      | Do không thỏa mãn cấu hình Node nên thất bại.                         |
| Lỗi |     Có     |      Có      | Node gặp lỗi chương trình chưa được bắt, kết thúc sớm.                   |
| Hủy |     Có     |      Có      | Node đang chờ bị người quản lý quy trình hủy thực thi từ bên ngoài, kết thúc sớm       |
| Từ chối |     Có     |      Có      | Trong Node xử lý thủ công, bị người dùng từ chối nên không tiếp tục các bước sau         |

Ngoài trạng thái Chờ, các trạng thái khác đều là trạng thái cuối của việc thực thi Node, chỉ có trạng thái cuối là "Hoàn tất" mới tiếp tục thực thi, còn lại đều dừng sớm việc thực thi của toàn bộ quy trình. Khi Node đang trong nhánh luồng (nhánh song song, phán đoán điều kiện, vòng lặp...), trạng thái cuối sinh ra khi thực thi Node sẽ được Node mở nhánh tiếp quản và xử lý, từ đó suy ra để quyết định việc luân chuyển của toàn bộ quy trình.

Ví dụ khi chúng ta sử dụng Node điều kiện ở chế độ "'Đúng' thì tiếp tục", khi thực thi nếu kết quả là "Sai" thì sẽ dừng sớm việc thực thi toàn bộ quy trình và thoát với trạng thái thất bại, không thực thi các Node phía sau, như hình dưới đây:

![Node thực thi thất bại](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Mẹo}
Tất cả các trạng thái dừng không phải "Hoàn tất" đều có thể được coi là thất bại, nhưng nguyên nhân thất bại lại khác nhau, có thể xem kết quả thực thi của Node để hiểu thêm nguyên nhân thất bại.
:::
