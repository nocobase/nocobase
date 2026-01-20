:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# FlowDefinition

FlowDefinition định nghĩa cấu trúc và cấu hình cơ bản của một luồng, là một trong những khái niệm cốt lõi của FlowEngine. Nó mô tả siêu dữ liệu, điều kiện kích hoạt, các bước thực thi, v.v. của luồng.

## Định nghĩa kiểu

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## Phương thức đăng ký

```ts
class MyModel extends FlowModel {}

// Đăng ký một luồng thông qua lớp model
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## Mô tả thuộc tính

### key

**Kiểu**: `string`  
**Bắt buộc**: Có  
**Mô tả**: Định danh duy nhất cho luồng.

Chúng tôi khuyến nghị sử dụng kiểu đặt tên nhất quán là `xxxSettings`, ví dụ:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

Cách đặt tên này giúp dễ dàng nhận diện và bảo trì, đồng thời khuyến nghị sử dụng nhất quán trên toàn bộ dự án.

**Ví dụ**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tiêu đề dễ đọc của luồng.

Chúng tôi khuyến nghị duy trì kiểu đặt tên nhất quán với `key`, sử dụng định dạng `Xxx settings`, ví dụ:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

Cách đặt tên này rõ ràng và dễ hiểu hơn, tạo điều kiện thuận lợi cho việc hiển thị trên giao diện người dùng và hợp tác nhóm.

**Ví dụ**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Giá trị mặc định**: `false`  
**Mô tả**: Cho biết luồng có chỉ được thực thi thủ công hay không.

- `true`: Luồng chỉ có thể được kích hoạt thủ công và sẽ không tự động thực thi.
- `false`: Luồng có thể tự động thực thi (mặc định tự động thực thi khi không có thuộc tính `on`).

**Ví dụ**:
```ts
manual: true  // Chỉ thực thi thủ công
manual: false // Có thể tự động thực thi
```

### sort

**Kiểu**: `number`  
**Bắt buộc**: Không  
**Giá trị mặc định**: `0`  
**Mô tả**: Thứ tự thực thi của luồng. Giá trị càng nhỏ, luồng càng được thực thi trước.

Có thể là số âm, dùng để kiểm soát thứ tự thực thi của nhiều luồng.

**Ví dụ**:
```ts
sort: -1  // Thực thi ưu tiên
sort: 0   // Thứ tự mặc định
sort: 1   // Thực thi sau
```

### on

**Kiểu**: `FlowEvent<TModel>`  
**Bắt buộc**: Không  
**Mô tả**: Cấu hình sự kiện cho phép luồng này được kích hoạt bởi `dispatchEvent`.

Chỉ dùng để khai báo tên sự kiện kích hoạt (chuỗi hoặc `{ eventName }`), không bao gồm hàm xử lý.

**Các loại sự kiện được hỗ trợ**:
- `'click'` - Sự kiện nhấp chuột
- `'submit'` - Sự kiện gửi
- `'reset'` - Sự kiện đặt lại
- `'remove'` - Sự kiện xóa
- `'openView'` - Sự kiện mở chế độ xem
- `'dropdownOpen'` - Sự kiện mở danh sách thả xuống
- `'popupScroll'` - Sự kiện cuộn cửa sổ bật lên
- `'search'` - Sự kiện tìm kiếm
- `'customRequest'` - Sự kiện yêu cầu tùy chỉnh
- `'collapseToggle'` - Sự kiện chuyển đổi thu gọn
- Hoặc bất kỳ chuỗi tùy chỉnh nào

**Ví dụ**:
```ts
on: 'click'  // Kích hoạt khi nhấp chuột
on: 'submit' // Kích hoạt khi gửi
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Kiểu**: `Record<string, StepDefinition<TModel>>`  
**Bắt buộc**: Có  
**Mô tả**: Định nghĩa các bước của luồng.

Định nghĩa tất cả các bước có trong luồng, mỗi bước có một khóa duy nhất.

**Ví dụ**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**Kiểu**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Bắt buộc**: Không  
**Mô tả**: Các tham số mặc định cấp luồng.

Khi model được khởi tạo (`createModel`), nó sẽ điền các giá trị ban đầu cho các tham số bước của "luồng hiện tại". Nó chỉ điền vào các giá trị còn thiếu, không ghi đè lên các giá trị đã có. Định dạng trả về cố định là: `{ [stepKey]: params }`

**Ví dụ**:
```ts
// Tham số mặc định tĩnh
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Tham số mặc định động
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Tham số mặc định bất đồng bộ
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Ví dụ đầy đủ

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```