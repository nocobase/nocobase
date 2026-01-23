:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Kế hoạch Thực thi (Lịch sử)

Sau khi một luồng công việc được kích hoạt, một kế hoạch thực thi tương ứng sẽ được tạo để theo dõi quá trình thực hiện của tác vụ đó. Mỗi kế hoạch thực thi có một giá trị trạng thái để biểu thị trạng thái thực thi hiện tại, trạng thái này có thể được xem trong danh sách và chi tiết của lịch sử thực thi:

![Trạng thái Kế hoạch Thực thi](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Khi tất cả các nút trong nhánh quy trình chính được thực thi đến điểm cuối của quy trình với trạng thái “Hoàn thành”, toàn bộ kế hoạch thực thi sẽ kết thúc với trạng thái “Hoàn thành”. Khi một nút trong nhánh quy trình chính có trạng thái cuối cùng như “Thất bại”, “Lỗi”, “Đã hủy” hoặc “Từ chối”, toàn bộ kế hoạch thực thi sẽ bị **chấm dứt sớm** với trạng thái tương ứng. Khi một nút trong nhánh quy trình chính có trạng thái “Đang chờ”, toàn bộ kế hoạch thực thi sẽ bị tạm dừng, nhưng vẫn hiển thị trạng thái “Đang thực thi”, cho đến khi nút đang chờ được tiếp tục. Các loại nút khác nhau xử lý trạng thái chờ khác nhau. Ví dụ, một nút thủ công cần chờ xử lý thủ công, trong khi một nút trì hoãn cần chờ đến khi thời gian quy định trôi qua mới tiếp tục thực thi.

Các trạng thái của một kế hoạch thực thi như sau:

| Trạng thái   | Trạng thái nút cuối cùng được thực thi trong quy trình chính | Ý nghĩa                                                  |
| ------------ | ----------------------------------------------------------- | -------------------------------------------------------- |
| Đang chờ xếp hàng | -                                                           | Luồng công việc đã được kích hoạt và tạo kế hoạch thực thi, đang chờ bộ điều phối sắp xếp thực hiện. |
| Đang thực thi | Đang chờ                                                    | Nút yêu cầu tạm dừng, chờ thêm đầu vào hoặc gọi lại để tiếp tục. |
| Hoàn thành   | Hoàn thành                                                  | Không gặp vấn đề nào, tất cả các nút đã được thực thi từng bước như mong đợi. |
| Thất bại     | Thất bại                                                    | Thất bại do cấu hình nút không được đáp ứng.             |
| Lỗi          | Lỗi                                                         | Nút gặp lỗi chương trình không được xử lý và kết thúc sớm. |
| Đã hủy       | Đã hủy                                                      | Một nút đang chờ đã bị quản trị viên luồng công việc hủy từ bên ngoài, kết thúc sớm. |
| Từ chối      | Từ chối                                                     | Trong nút xử lý thủ công, đã bị từ chối thủ công và quy trình tiếp theo sẽ không tiếp tục. |

Trong ví dụ [Bắt đầu nhanh](../getting-started.md), chúng ta đã biết rằng việc xem chi tiết lịch sử thực thi của một luồng công việc có thể giúp kiểm tra xem tất cả các nút có được thực thi bình thường hay không, cũng như trạng thái thực thi và dữ liệu kết quả của mỗi nút đã thực thi. Trong một số quy trình và nút nâng cao, một nút có thể có nhiều kết quả, ví dụ như kết quả của một nút lặp:

![Kết quả nút từ nhiều lần thực thi](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Mẹo}
Các luồng công việc có thể được kích hoạt đồng thời, nhưng chúng được thực thi tuần tự theo hàng đợi. Ngay cả khi nhiều luồng công việc được kích hoạt cùng lúc, chúng sẽ được thực thi từng cái một, không song song. Do đó, khi xuất hiện trạng thái “Đang chờ xếp hàng”, điều đó có nghĩa là có các luồng công việc khác đang chạy và cần phải chờ.

Trạng thái “Đang thực thi” chỉ cho biết kế hoạch thực thi đó đã bắt đầu và thường bị tạm dừng do trạng thái chờ của một nút bên trong, chứ không có nghĩa là kế hoạch thực thi này đã chiếm quyền ưu tiên tài nguyên thực thi ở đầu hàng đợi. Do đó, khi có một kế hoạch thực thi “Đang thực thi”, các kế hoạch thực thi “Đang chờ xếp hàng” khác vẫn có thể được lên lịch để bắt đầu thực hiện.
:::

## Trạng thái Thực thi Nút

Trạng thái của một kế hoạch thực thi được xác định bởi việc thực thi của từng nút trong đó. Trong một kế hoạch thực thi sau khi được kích hoạt, mỗi nút sẽ tạo ra một trạng thái thực thi sau khi chạy, và trạng thái này sẽ quyết định liệu quy trình tiếp theo có tiếp tục thực hiện hay không. Thông thường, sau khi một nút thực thi thành công, nút tiếp theo sẽ được thực thi, cho đến khi tất cả các nút được thực thi tuần tự hoặc quy trình bị gián đoạn. Khi gặp các nút liên quan đến kiểm soát luồng, như nhánh, lặp, song song, trì hoãn, v.v., luồng thực thi đến nút tiếp theo sẽ được xác định dựa trên các điều kiện được cấu hình trong nút và dữ liệu ngữ cảnh thời gian chạy.

Các trạng thái có thể có của một nút sau khi thực thi như sau:

| Trạng thái   | Là trạng thái cuối cùng | Chấm dứt sớm | Ý nghĩa                                                  |
| ------------ | :--------------------: | :----------: | -------------------------------------------------------- |
| Đang chờ     |           Không        |      Không   | Nút yêu cầu tạm dừng, chờ thêm đầu vào hoặc gọi lại để tiếp tục. |
| Hoàn thành   |           Có           |      Không   | Không gặp vấn đề nào, thực thi thành công và tiếp tục đến nút tiếp theo cho đến khi kết thúc. |
| Thất bại     |           Có           |      Có      | Thất bại do cấu hình nút không được đáp ứng.             |
| Lỗi          |           Có           |      Có      | Nút gặp lỗi chương trình không được xử lý và kết thúc sớm. |
| Đã hủy       |           Có           |      Có      | Một nút đang chờ đã bị quản trị viên luồng công việc hủy từ bên ngoài, kết thúc sớm. |
| Từ chối      |           Có           |      Có      | Trong nút xử lý thủ công, đã bị từ chối thủ công và quy trình tiếp theo sẽ không tiếp tục. |

Ngoại trừ trạng thái “Đang chờ”, tất cả các trạng thái khác đều là trạng thái cuối cùng cho việc thực thi nút. Chỉ khi trạng thái cuối cùng là “Hoàn thành” thì quy trình mới tiếp tục; nếu không, toàn bộ quá trình thực thi luồng công việc sẽ bị chấm dứt sớm. Khi một nút nằm trong một luồng nhánh (nhánh song song, điều kiện, lặp, v.v.), trạng thái cuối cùng được tạo ra bởi việc thực thi của nút sẽ được xử lý bởi nút đã khởi tạo nhánh, và điều này sẽ quyết định luồng của toàn bộ luồng công việc.

Ví dụ, khi chúng ta sử dụng một nút điều kiện ở chế độ “Nếu ‘Có’ thì tiếp tục”, nếu kết quả là “Không” trong quá trình thực thi, toàn bộ luồng công việc sẽ bị chấm dứt sớm với trạng thái “Thất bại”, và các nút tiếp theo sẽ không được thực thi, như hình dưới đây:

![Nút thực thi thất bại](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Mẹo}
Tất cả các trạng thái chấm dứt không phải là “Hoàn thành” đều có thể được coi là thất bại, nhưng nguyên nhân thất bại thì khác nhau. Bạn có thể xem kết quả thực thi của nút để hiểu rõ hơn về nguyên nhân thất bại.
:::