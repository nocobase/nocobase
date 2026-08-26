---
title: "FlowModel so với Component React"
description: "FlowModel so với React.Component: cấu hình hóa vs code hóa, khả năng điều phối, lựa chọn ngữ cảnh áp dụng, tham chiếu lựa chọn FlowEngine."
keywords: "FlowModel,Component React,So sánh,Có thể điều phối,Cấu hình hóa,Lựa chọn FlowEngine,NocoBase"
---

# FlowModel vs React.Component

## So sánh trách nhiệm cơ bản

| Tính năng/Năng lực         | `React.Component`       | `FlowModel`                            |
| ------------- | ----------------------- | -------------------------------------- |
| Khả năng render          | Có, phương thức `render()` sinh UI    | Có, phương thức `render()` sinh UI                   |
| Quản lý trạng thái          | `state` và `setState` tích hợp | Dùng `props`, nhưng quản lý trạng thái phụ thuộc nhiều hơn vào cấu trúc cây model               |
| Vòng đời          | Có, như `componentDidMount` | Có, như `onInit`, `onMount`, `onUnmount`     |
| Mục đích            | Xây dựng component UI                | Xây dựng "cây model" được điều khiển bởi dữ liệu, luồng hóa, có cấu trúc                   |
| Cấu trúc dữ liệu          | Cây component                     | Cây model (hỗ trợ model cha-con, đa instance Fork)                   |
| Component con           | Lồng component bằng JSX             | Dùng `setSubModel`/`addSubModel` để thiết lập subModel tường minh |
| Hành vi động          | Gắn sự kiện, cập nhật trạng thái điều khiển UI          | Đăng ký/phát Flow, xử lý luồng tự động                      |
| Lưu trữ           | Không có cơ chế tích hợp                   | Hỗ trợ lưu trữ (như `model.save()`)                |
| Hỗ trợ Fork (render nhiều lần) | Không (cần tái sử dụng thủ công)                | Có (đa instance hóa với `createFork`)                   |
| Kiểm soát engine          | Không                       | Có, được `FlowEngine` quản lý, đăng ký và tải              |

## So sánh vòng đời

| Hook vòng đời | `React.Component`                 | `FlowModel`                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| Khởi tạo    | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Hủy bỏ     | `componentWillUnmount`            | `onUnmount`                                  |
| Phản hồi đầu vào   | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Xử lý lỗi   | `componentDidCatch`               | `onAutoFlowsError`                      |

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

## Cây component vs cây model

* **Cây component React**: Cây render UI được hình thành bởi việc lồng JSX khi runtime.
* **Cây model FlowModel**: Cây cấu trúc logic do FlowEngine quản lý, có thể lưu trữ, đăng ký và kiểm soát động subModel, phù hợp xây dựng các Block trang, luồng thao tác, model dữ liệu, v.v.

## Chức năng đặc biệt (chỉ có ở FlowModel)

| Chức năng                               | Mô tả                     |
| -------------------------------- | ---------------------- |
| `registerFlow`                 | Đăng ký Flow             |
| `applyFlow` / `dispatchEvent` | Thực thi/Kích hoạt Flow             |
| `setSubModel` / `addSubModel`         | Kiểm soát tường minh việc tạo và gắn subModel          |
| `createFork`                          | Hỗ trợ một logic model được tái sử dụng render nhiều lần (như mỗi hàng của bảng) |
| `openFlowSettings`                    | Cài đặt bước Flow |
| `save` / `saveStepParams()`           | Model có thể lưu trữ, kết nối với backend           |

## Tóm tắt

| Mục   | React.Component | FlowModel              |
| ---- | --------------- | ---------------------- |
| Ngữ cảnh phù hợp | Tổ chức component tầng UI        | Quản lý luồng và Block được điều khiển bởi dữ liệu           |
| Tư tưởng cốt lõi | UI khai báo          | Luồng có cấu trúc được điều khiển bởi model             |
| Cách quản lý | React kiểm soát vòng đời    | FlowModel kiểm soát vòng đời và cấu trúc model |
| Ưu điểm   | Hệ sinh thái và toolchain phong phú        | Cấu trúc mạnh, luồng có thể lưu trữ, subModel có thể kiểm soát      |

> FlowModel có thể dùng bổ sung với React: dùng React để render trong FlowModel, còn FlowEngine quản lý vòng đời và cấu trúc của nó.
