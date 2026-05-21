---
title: "ctx.getModel()"
description: "ctx.getModel() lấy instance model block hoặc form theo uid, dùng cho truy cập xuyên block, liên kết, refresh dữ liệu."
keywords: "ctx.getModel,uid,model block,model form,xuyên block,RunJS,NocoBase"
---

# ctx.getModel()

Lấy instance model (như BlockModel, PageModel, ActionModel, v.v.) trong engine hoặc view stack hiện tại theo `uid`, dùng để truy cập các model khác xuyên block, xuyên page hoặc xuyên popup trong RunJS.

Nếu chỉ cần model hoặc block của ngữ cảnh thực thi hiện tại, ưu tiên sử dụng `ctx.model` hoặc `ctx.blockModel`, không cần dùng `ctx.getModel`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSAction** | Lấy model của block khác theo `uid` đã biết, đọc/ghi `resource`, `form`, `setProps`, v.v. của nó |
| **RunJS trong popup** | Khi cần truy cập một model trên page mở popup từ trong popup, truyền `searchInPreviousEngines: true` |
| **Action tùy chỉnh** | Định vị form hoặc sub-model trong panel cấu hình theo `uid` xuyên view stack, đọc cấu hình hoặc trạng thái |

## Định nghĩa kiểu

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Tham số

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `uid` | `string` | Định danh duy nhất của instance model đích, được chỉ định khi cấu hình hoặc tạo (như `ctx.model.uid`) |
| `searchInPreviousEngines` | `boolean` | Tùy chọn, mặc định `false`. Khi là `true`, tìm trong "view stack" từ engine hiện tại lên gốc, có thể lấy model của engine cấp trên (như page mở popup) |

## Giá trị trả về

- Nếu tìm thấy, trả về instance subclass `FlowModel` tương ứng (như `BlockModel`, `FormBlockModel`, `ActionModel`).
- Nếu không tìm thấy, trả về `undefined`.

## Phạm vi tìm kiếm

- **Mặc định (`searchInPreviousEngines: false`)**: Chỉ tìm theo `uid` trong **engine hiện tại**. Trong popup, view nhiều cấp, mỗi view có engine độc lập, mặc định chỉ tìm model trong view hiện tại.
- **`searchInPreviousEngines: true`**: Bắt đầu từ engine hiện tại, tìm lên theo chuỗi `previousEngine`, trả về khi có kết quả. Phù hợp khi cần truy cập một model của page mở popup từ trong popup.

## Ví dụ

### Lấy block khác và refresh

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Truy cập model trên page từ trong popup

```ts
// 弹窗内需访问打开它的页面上的区块
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Đọc/ghi xuyên model và trigger rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Kiểm tra an toàn

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('目标模型不存在');
  return;
}
```

## Liên quan

- [ctx.model](./model.md): Model nơi ngữ cảnh thực thi hiện tại đang nằm
- [ctx.blockModel](./block-model.md): Model block cha nơi JS hiện tại đang nằm, thường có thể truy cập mà không cần `getModel`
