---
pkg: '@nocobase/plugin-workflow-manual'
title: "Xử lý thủ công"
description: "Node xử lý thủ công: trao quyền quyết định quy trình cho người dùng, sinh Task chờ làm, hỗ trợ phê duyệt, tiếp tục/chờ/dừng quy trình."
keywords: "workflow,xử lý thủ công,phê duyệt,task chờ làm,hợp tác người máy,NocoBase"
---

# Xử lý thủ công

## Giới thiệu

Khi quy trình nghiệp vụ không thể hoàn toàn ra quyết định tự động, có thể qua Node thủ công, trao một phần quyền quyết định cho người xử lý thủ công.

Node thủ công khi thực thi đến sẽ gián đoạn việc thực thi của toàn bộ quy trình trước, sinh Task chờ làm cho người dùng tương ứng, sau khi người dùng gửi sẽ tùy theo trạng thái được chọn để quyết định tiếp tục quy trình, tiếp tục chờ hay dừng quy trình. Sẽ rất hữu ích trong các tình huống như phê duyệt quy trình.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Xử lý thủ công":

![Tạo Node thủ công](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Cấu hình Node

### Người phụ trách

Node thủ công cần chỉ định một người dùng làm người thực thi Task chờ làm. Danh sách Task chờ làm có thể được thêm khi thêm Block trong trang, nội dung popup Task của mỗi Node cần được cấu hình giao diện trong Node.

Chọn một người dùng hoặc qua biến chọn khóa chính hay khóa ngoại của dữ liệu người dùng trong ngữ cảnh.

![Node thủ công_cấu hình_người phụ trách_chọn biến](https://static-docs.nocobase.com/22fbca3b8e21fda3a831019037001445.png)

:::info{title=Mẹo}
Hiện tại tùy chọn người phụ trách của Node thủ công tạm thời chưa hỗ trợ xử lý cho nhiều người, sẽ được hỗ trợ trong các phiên bản tương lai.
:::

### Cấu hình giao diện người dùng

Cấu hình giao diện của Task chờ làm là nội dung cốt lõi của Node thủ công, có thể qua việc bấm nút "Cấu hình giao diện người dùng" để mở popup cấu hình độc lập, giống như trang thông thường, có thể cấu hình theo cách WYSIWYG:

![Node thủ công_cấu hình Node_cấu hình giao diện](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Tab

Tab có thể được dùng để phân biệt các nội dung khác nhau, ví dụ một tab dùng cho gửi form thông qua, một tab khác dùng cho gửi form từ chối, hoặc dùng để hiển thị chi tiết dữ liệu liên quan..., có thể cấu hình tự do.

#### Block

Các loại Block được hỗ trợ chủ yếu có hai nhóm lớn, Block dữ liệu và Block form, ngoài ra Markdown chủ yếu được dùng cho nội dung tĩnh như thông tin nhắc...

##### Block dữ liệu

Block dữ liệu có thể chọn dữ liệu Trigger hoặc kết quả xử lý của Node bất kỳ, dùng để cung cấp thông tin ngữ cảnh liên quan cho người phụ trách Task chờ làm. Ví dụ Workflow được kích hoạt bởi sự kiện form, có thể tạo một Block chi tiết của dữ liệu kích hoạt, giống cấu hình chi tiết của trang thông thường, có thể tùy chọn các trường có trong dữ liệu kích hoạt để hiển thị dữ liệu:

![Node thủ công_cấu hình Node_cấu hình giao diện_Block dữ liệu_Trigger](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Block dữ liệu Node tương tự, có thể chọn kết quả dữ liệu trong Node phía trên làm chi tiết hiển thị. Ví dụ kết quả của một Node tính toán phía trên làm thông tin tham khảo ngữ cảnh cho Task chờ làm của người phụ trách:

![Node thủ công_cấu hình Node_cấu hình giao diện_Block dữ liệu_dữ liệu Node](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Mẹo}
Vì khi cấu hình giao diện, Workflow đều ở trạng thái chưa thực thi, nên trong các Block dữ liệu đều không hiển thị dữ liệu cụ thể, chỉ khi Workflow được kích hoạt thực thi, trong giao diện popup Task chờ làm mới có thể thấy dữ liệu liên quan của quy trình cụ thể.
:::

##### Block form

Trong giao diện Task chờ làm cần cấu hình ít nhất một Block form làm xử lý quyết định cuối cùng cho việc Workflow có tiếp tục thực thi hay không, không cấu hình form sẽ dẫn đến việc quy trình sau khi gián đoạn không thể tiếp tục. Block form có ba loại lần lượt là:

- Form tùy chỉnh
- Form thêm dữ liệu
- Form cập nhật dữ liệu

![Node thủ công_cấu hình Node_cấu hình giao diện_loại form](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Form thêm dữ liệu và form cập nhật dữ liệu cần chọn bảng dữ liệu dựa trên, sau khi người dùng chờ làm gửi sẽ sử dụng giá trị trong form để thêm hoặc cập nhật dữ liệu của bảng dữ liệu cụ thể. Form tùy chỉnh thì có thể tự do định nghĩa một form tạm thời không liên quan đến bảng dữ liệu, giá trị trường sau khi người dùng chờ làm gửi có thể được sử dụng trong các Node tiếp theo.

Nút gửi của form có thể được cấu hình ba loại lần lượt là:

- Tiếp tục quy trình sau khi gửi
- Dừng quy trình sau khi gửi
- Chỉ tạm lưu giá trị form

![Node thủ công_cấu hình Node_cấu hình giao diện_nút form](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Ba nút đại diện cho ba trạng thái Node trong xử lý quy trình, sau khi gửi trạng thái của Node được sửa thành "Hoàn tất", "Từ chối" hoặc tiếp tục ở trạng thái "Chờ", một form ít nhất phải cấu hình một trong hai cái đầu để quyết định hướng xử lý tiếp theo của toàn bộ quy trình.

Trên nút "Tiếp tục quy trình" có thể cấu hình gán giá trị cho các trường form:

![Node thủ công_cấu hình Node_cấu hình giao diện_nút form_đặt giá trị form](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Node thủ công_cấu hình Node_cấu hình giao diện_nút form_popup đặt giá trị form](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Sau khi mở popup có thể gán giá trị cho các trường form bất kỳ, sau khi form gửi sẽ lấy giá trị đó làm giá trị cuối cùng của trường. Thường khá hữu ích khi kiểm duyệt một số dữ liệu, có thể sử dụng nhiều nút "Tiếp tục quy trình" khác nhau trong form, mỗi nút đặt giá trị enum khác nhau cho các trường loại trạng thái tương tự, để đạt được hiệu quả tiếp tục thực thi quy trình tiếp theo và sử dụng các giá trị dữ liệu khác nhau.

## Block Task chờ làm

Đối với xử lý thủ công, còn cần thêm danh sách Task chờ làm trong trang để hiển thị Task chờ làm, người liên quan mới có thể qua danh sách đó vào xử lý Task cụ thể của Node thủ công.

### Thêm Block

Có thể chọn "Task chờ làm Workflow" từ Block trong trang để thêm Block danh sách Task chờ làm:

![Node thủ công_thêm Block Task chờ làm](https://static-docs.nocobase.com/198b417454cd73b704267bf30fe5e647.png)

Ví dụ Block danh sách Task chờ làm:

![Node thủ công_danh sách Task chờ làm](https://static-docs.nocobase.com/cfefb0d2c6a91c5c9dfa550d6b220f34.png)

### Chi tiết Task chờ làm

Sau đó người liên quan có thể bấm vào Task chờ làm tương ứng, vào popup Task chờ làm để xử lý thủ công:

![Node thủ công_chi tiết Task chờ làm](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Ví dụ

### Kiểm duyệt bài viết

Giả sử bài viết do người dùng thông thường gửi cần được admin duyệt thông qua mới có thể cập nhật thành trạng thái đã phát hành, ngược lại nếu từ chối quy trình đó, bài viết sẽ giữ trạng thái nháp (không công khai), quy trình này có thể được triển khai bằng form cập nhật trong Node thủ công.

Tạo một Workflow được kích hoạt bởi "Thêm bài viết" và thêm một Node thủ công:

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_điều phối quy trình" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Trong Node thủ công cấu hình người phụ trách là admin, trong giao diện cấu hình thêm một Block dựa trên dữ liệu Trigger để hiển thị chi tiết bài viết được thêm:

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_cấu hình Node_Block chi tiết" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Trong giao diện cấu hình thêm một Block dựa trên form cập nhật dữ liệu, chọn bảng bài viết, để admin quyết định có thông qua kiểm duyệt hay không, sau khi thông qua kiểm duyệt sẽ cập nhật bài viết tương ứng theo các cấu hình khác phía sau. Sau khi thêm form, mặc định sẽ có một nút "Tiếp tục quy trình", có thể coi nó là sau khi bấm thì thông qua, thêm thêm một nút "Dừng quy trình" cho trường hợp không thông qua kiểm duyệt:

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_cấu hình Node_form và Action" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Khi tiếp tục quy trình, chúng ta cần cập nhật trạng thái bài viết, ở đây có hai cách cấu hình, một là trực tiếp hiển thị trường trạng thái bài viết trong form để người thao tác chọn, cách này phù hợp hơn cho các tình huống cần chủ động điền form như góp ý phản hồi...:

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_cấu hình Node_trường form" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Để đơn giản hóa thao tác của người thao tác, cách khác là cấu hình gán giá trị form trên nút "Tiếp tục quy trình", trong gán giá trị thêm một trường "Trạng thái" với giá trị "Đã phát hành" thì có nghĩa là sau khi người thao tác bấm nút, bài viết sẽ được cập nhật thành trạng thái đã phát hành:

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_cấu hình Node_gán giá trị form" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Sau đó trong menu cấu hình ở góc trên bên phải của Block form chọn điều kiện lọc dữ liệu cần cập nhật, ở đây chọn bảng "Bài viết", điều kiện lọc là "ID `bằng` Biến Trigger / Dữ liệu kích hoạt / ID":

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_cấu hình Node_điều kiện form" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Cuối cùng, có thể sửa tiêu đề của các Block và text của các nút liên quan, cũng như text nhắc của các trường form để giao diện thân thiện hơn:

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_cấu hình Node_form cuối cùng" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Đóng panel cấu hình, bấm nút gửi để lưu cấu hình Node, Workflow đã được cấu hình xong. Sau khi bật Workflow này, khi thêm bài viết, sẽ tự động kích hoạt Workflow này, admin có thể thấy Workflow này cần xử lý từ danh sách Task chờ làm, sau khi bấm xem có thể thấy chi tiết Task chờ làm:

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_danh sách Task chờ làm" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Node thủ công_ví dụ_kiểm duyệt bài viết_chi tiết Task chờ làm" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Admin có thể dựa vào chi tiết bài viết để phán đoán thủ công xem bài viết đó có thể phát hành hay không, nếu có thể, bấm nút "Thông qua", bài viết sẽ được cập nhật thành trạng thái đã phát hành, nếu không, bấm nút "Từ chối", bài viết sẽ giữ trạng thái nháp.

## Phê duyệt nghỉ phép

Giả sử nhân viên cần xin nghỉ phép, cần được quản lý phê duyệt thông qua mới có hiệu lực và đối ứng dữ liệu nghỉ phép của nhân viên tương ứng. Và bất kể thông qua hay từ chối, đều sẽ qua Node Request gọi interface SMS để gửi tin nhắn thông báo liên quan cho nhân viên (xem phần [HTTP Request](#http-request)). Tình huống này có thể được triển khai bằng form tùy chỉnh trong Node thủ công.

Tạo một Workflow được kích hoạt bởi "Thêm nghỉ phép" và thêm một Node thủ công, tương tự quy trình kiểm duyệt bài viết trước đó, chỉ khác là người phụ trách ở đây là quản lý, trong giao diện cấu hình thêm một Block dựa trên dữ liệu Trigger để hiển thị chi tiết nghỉ phép được thêm, thêm thêm một Block dựa trên form tùy chỉnh để quản lý quyết định có thông qua kiểm duyệt hay không, trong form tùy chỉnh thêm một trường có thông qua không và một trường lý do từ chối:

<figure>
  <img alt="Node thủ công_ví dụ_phê duyệt nghỉ phép_cấu hình Node" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Khác với quy trình kiểm duyệt bài viết, vì chúng ta cần tiếp tục quy trình tiếp theo dựa trên kết quả phê duyệt của quản lý, nên ở đây chúng ta chỉ cấu hình một nút "Tiếp tục quy trình" làm nút gửi sử dụng và không sử dụng nút "Dừng quy trình".

Đồng thời sau Node thủ công, chúng ta có thể qua một Node phán đoán điều kiện để phán đoán quản lý đã thông qua đề nghị nghỉ phép đó hay chưa, trong nhánh thông qua thêm xử lý dữ liệu đối ứng nghỉ phép và sau khi nhánh kết thúc thêm một Node Request để gửi tin nhắn SMS thông báo nhân viên, sẽ thu được quy trình hoàn chỉnh sau:

<figure>
  <img alt="Node thủ công_ví dụ_phê duyệt nghỉ phép_điều phối quy trình" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Trong đó cấu hình điều kiện trong Node phán đoán điều kiện là "Node thủ công / Dữ liệu form tùy chỉnh / Giá trị của trường có thông qua không có phải là 'Thông qua' không":

<figure>
  <img alt="Node thủ công_ví dụ_phê duyệt nghỉ phép_phán đoán điều kiện" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Dữ liệu trong Node Request gửi cũng có thể sử dụng các biến form tương ứng trong Node thủ công để phân biệt nội dung tin nhắn SMS thông qua và từ chối. Như vậy đã hoàn tất cấu hình toàn bộ quy trình, sau khi bật Workflow, khi nhân viên gửi form đề nghị nghỉ phép, quản lý có thể xử lý phê duyệt trong Task chờ làm, thao tác cơ bản tương tự quy trình kiểm duyệt bài viết.
