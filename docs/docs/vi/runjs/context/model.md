---
title: "ctx.model"
description: "ctx.model là instance FlowModel nơi ngữ cảnh thực thi RunJS hiện tại đang nằm, là điểm vào mặc định cho JSBlock/JSField/JSAction, BlockModel, ActionModel, JSEditableFieldModel."
keywords: "ctx.model,FlowModel,BlockModel,ActionModel,JSBlock,JSField,JSAction,RunJS,NocoBase"
---

# ctx.model

Instance `FlowModel` nơi ngữ cảnh thực thi RunJS hiện tại đang nằm, là điểm vào mặc định cho các kịch bản như JSBlock, JSField, JSAction. Kiểu cụ thể thay đổi theo ngữ cảnh: có thể là subclass như `BlockModel`, `ActionModel`, `JSEditableFieldModel`, v.v.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | `ctx.model` chính là model block hiện tại, có thể truy cập `resource`, `collection`, `setProps`, v.v. |
| **JSField / JSItem / JSColumn** | `ctx.model` là model field, có thể truy cập `setProps`, `dispatchEvent`, v.v. |
| **Sự kiện action / ActionModel** | `ctx.model` là model action, có thể đọc/ghi tham số bước, dispatch sự kiện, v.v. |

> Mẹo: Nếu cần truy cập **block cha chứa JS hiện tại** (như block form/table), sử dụng `ctx.blockModel`; nếu cần truy cập **model khác**, sử dụng `ctx.getModel(uid)`.

## Định nghĩa kiểu

```ts
model: FlowModel;
```

`FlowModel` là class cơ sở, runtime thực tế là các subclass khác nhau (như `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, v.v.), thuộc tính và phương thức khả dụng khác nhau theo kiểu.

## Thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `uid` | `string` | Định danh duy nhất của model, có thể dùng cho `ctx.getModel(uid)` hoặc bind UID popup |
| `collection` | `Collection` | Collection được bind với model hiện tại (tồn tại khi block/field bind với data) |
| `resource` | `Resource` | Instance resource liên kết, dùng cho refresh, lấy hàng đã chọn, v.v. |
| `props` | `object` | Cấu hình UI/hành vi của model, có thể cập nhật bằng `setProps` |
| `subModels` | `Record<string, FlowModel>` | Tập hợp sub-model (như field trong form, column trong table) |
| `parent` | `FlowModel` | Model cha (nếu có) |

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `setProps(partialProps: any): void` | Cập nhật cấu hình model, trigger render lại (như `ctx.model.setProps({ loading: true })`) |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Dispatch sự kiện đến model, trigger các flow được cấu hình trên model đó lắng nghe tên sự kiện này. `payload` tùy chọn truyền cho handler flow; `options.debounce` có thể bật debounce |
| `getStepParams?.(flowKey, stepKey)` | Đọc tham số bước flow cấu hình (kịch bản panel cấu hình, action tùy chỉnh, v.v.) |
| `setStepParams?.(flowKey, stepKey, params)` | Ghi tham số bước flow cấu hình |

## Quan hệ với ctx.blockModel, ctx.getModel

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Model nơi ngữ cảnh thực thi hiện tại đang nằm** | `ctx.model` |
| **Block cha nơi JS hiện tại đang nằm** | `ctx.blockModel`, thường dùng để truy cập `resource`, `form`, `collection` |
| **Lấy bất kỳ model nào theo uid** | `ctx.getModel(uid)` hoặc `ctx.getModel(uid, true)` (tìm xuyên view stack) |

Trong JSField, `ctx.model` là model field, `ctx.blockModel` là block form/table chứa field đó.

## Ví dụ

### Cập nhật trạng thái block/action

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Dispatch sự kiện model

```ts
// 派发事件，触发该模型上配置的、监听该事件名的流程
await ctx.model.dispatchEvent('remove');
// 带 payload 时，会传给流程 handler 的 ctx.inputArgs
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Sử dụng uid để bind popup hoặc truy cập xuyên model

```ts
const myUid = ctx.model.uid;
// 弹窗配置中可传入 openerUid: myUid，用于关联
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Liên quan

- [ctx.blockModel](./block-model.md): Model block cha nơi JS hiện tại đang nằm
- [ctx.getModel()](./get-model.md): Lấy model khác theo uid
