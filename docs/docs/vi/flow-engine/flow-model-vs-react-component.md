:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# FlowModel so với React.Component

## So sánh trách nhiệm cơ bản

| Đặc điểm/Khả năng       | `React.Component`                  | `FlowModel`                                  |
| :-------------------- | :--------------------------------- | :------------------------------------------- |
| Khả năng hiển thị (render) | Có, phương thức `render()` tạo ra giao diện người dùng (UI) | Có, phương thức `render()` tạo ra giao diện người dùng (UI) |
| Quản lý trạng thái    | `state` và `setState` tích hợp sẵn | Sử dụng `props`, nhưng việc quản lý trạng thái phụ thuộc nhiều hơn vào cấu trúc cây mô hình |
| Vòng đời              | Có, ví dụ như `componentDidMount`  | Có, ví dụ như `onInit`, `onMount`, `onUnmount` |
| Mục đích sử dụng      | Xây dựng các thành phần UI         | Xây dựng "cây mô hình" có cấu trúc, dựa trên dữ liệu và luồng |
| Cấu trúc dữ liệu      | Cây thành phần                     | Cây mô hình (hỗ trợ mô hình cha-con, Fork đa phiên bản) |
| Thành phần con        | Sử dụng JSX để lồng các thành phần | Sử dụng `setSubModel`/`addSubModel` để thiết lập rõ ràng các mô hình con |
| Hành vi động          | Liên kết sự kiện, cập nhật trạng thái điều khiển UI | Đăng ký/phân phối các luồng, xử lý các luồng tự động |
| Khả năng lưu trữ bền vững | Không có cơ chế tích hợp sẵn       | Hỗ trợ lưu trữ bền vững (ví dụ: `model.save()`) |
| Hỗ trợ Fork (hiển thị nhiều lần) | Không (cần tái sử dụng thủ công) | Có (`createFork` để tạo nhiều phiên bản)     |
| Kiểm soát bởi Engine  | Không                             | Có, được `FlowEngine` quản lý, đăng ký và tải |

## So sánh vòng đời

| Hook vòng đời | `React.Component`                 | `FlowModel`                                  |
| :------------ | :-------------------------------- | :------------------------------------------- |
| Khởi tạo      | `constructor`, `componentDidMount` | `onInit`, `onMount`                          |
| Hủy bỏ (Unmount) | `componentWillUnmount`            | `onUnmount`                                  |
| Phản hồi đầu vào | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows`      |
| Xử lý lỗi     | `componentDidCatch`               | `onAutoFlowsError`                           |

## So sánh cấu trúc xây dựng

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Cây thành phần so với Cây mô hình

*   **Cây thành phần React**: Là cây hiển thị giao diện người dùng (UI) được hình thành bởi các thành phần JSX lồng nhau trong thời gian chạy.
*   **Cây mô hình FlowModel**: Là cây cấu trúc logic được quản lý bởi FlowEngine, có khả năng lưu trữ bền vững, cho phép đăng ký động và kiểm soát các mô hình con. Phù hợp để xây dựng các khối trang, luồng thao tác, mô hình dữ liệu, v.v.

## Các tính năng đặc biệt (chỉ có ở FlowModel)

| Chức năng                             | Mô tả                                          |
| :------------------------------------ | :--------------------------------------------- |
| `registerFlow`                        | Đăng ký luồng                                  |
| `applyFlow` / `dispatchEvent`         | Thực thi/kích hoạt luồng                       |
| `setSubModel` / `addSubModel`         | Kiểm soát rõ ràng việc tạo và liên kết các mô hình con |
| `createFork`                          | Hỗ trợ tái sử dụng logic của một mô hình để hiển thị nhiều lần (ví dụ: mỗi hàng trong bảng) |
| `openFlowSettings`                    | Cài đặt bước luồng                             |
| `save` / `saveStepParams()`           | Mô hình có thể được lưu trữ bền vững và tích hợp với backend |

## Tóm tắt

| Mục           | React.Component                 | FlowModel                                    |
| :------------ | :------------------------------ | :------------------------------------------- |
| Các trường hợp phù hợp | Tổ chức thành phần lớp UI       | Quản lý luồng và khối dựa trên dữ liệu       |
| Ý tưởng cốt lõi | UI khai báo                     | Luồng có cấu trúc dựa trên mô hình           |
| Phương thức quản lý | React kiểm soát vòng đời        | FlowModel kiểm soát vòng đời và cấu trúc của mô hình |
| Ưu điểm       | Hệ sinh thái và bộ công cụ phong phú | Cấu trúc chặt chẽ, luồng có thể lưu trữ bền vững, mô hình con có thể kiểm soát |

> FlowModel có thể được sử dụng bổ trợ với React: Sử dụng React để hiển thị trong FlowModel, trong khi vòng đời và cấu trúc của nó được FlowEngine quản lý.