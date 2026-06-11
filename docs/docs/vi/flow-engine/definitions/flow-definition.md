---
title: "FlowDefinition Định nghĩa Flow"
description: "FlowDefinition định nghĩa cấu trúc cơ bản và cấu hình Flow: key, on, steps, defaultParams, mô tả thông tin meta của Flow, điều kiện kích hoạt, các Step thực thi, là kiểu cốt lõi của FlowEngine."
keywords: "FlowDefinition,định nghĩa Flow,cấu hình Flow,on,steps,defaultParams,kiểu FlowEngine,NocoBase"
---

# FlowDefinition

FlowDefinition định nghĩa cấu trúc cơ bản và cấu hình Flow, là một trong những khái niệm cốt lõi của Flow engine. Nó mô tả thông tin meta của Flow, điều kiện kích hoạt, các Step thực thi, v.v.

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

Trong đó kiểu của `on` như sau:

```ts
type FlowEventPhase =
  | 'beforeAllFlows'
  | 'afterAllFlows'
  | 'beforeFlow'
  | 'afterFlow'
  | 'beforeStep'
  | 'afterStep';

type FlowEvent<TModel extends FlowModel = FlowModel> =
  | string
  | {
      eventName: string;
      defaultParams?: Record<string, any>;
      phase?: FlowEventPhase;
      flowKey?: string;
      stepKey?: string;
    };
```

## Cách đăng ký

```ts
class MyModel extends FlowModel {}

// Đăng ký Flow thông qua class Model
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
**Mô tả**: Định danh duy nhất của Flow

Khuyến nghị đặt tên theo phong cách thống nhất `xxxSettings`, ví dụ:
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

Cách đặt tên này dễ nhận biết và bảo trì, khuyến nghị thống nhất toàn cục.

**Ví dụ**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tiêu đề Flow dễ đọc

Khuyến nghị giữ phong cách nhất quán với key, đặt tên theo `Xxx settings`, ví dụ:
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

Cách đặt tên này rõ ràng, dễ hiểu, thuận tiện cho việc hiển thị giao diện và làm việc nhóm.

**Ví dụ**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Kiểu**: `boolean`  
**Bắt buộc**: Không  
**Mặc định**: `false`  
**Mô tả**: Có chỉ thực thi Flow thủ công hay không

- `true`: Flow chỉ có thể được kích hoạt thủ công, không tự động thực thi
- `false`: Flow có thể tự động thực thi (mặc định tự động thực thi khi không có thuộc tính `on`)

**Ví dụ**:
```ts
manual: true  // Chỉ thực thi thủ công
manual: false // Có thể tự động thực thi
```

### sort

**Kiểu**: `number`  
**Bắt buộc**: Không  
**Mặc định**: `0`  
**Mô tả**: Thứ tự thực thi Flow, giá trị càng nhỏ càng được thực thi trước

Có thể là số âm, dùng để điều khiển thứ tự thực thi của nhiều Flow.

**Ví dụ**:
```ts
sort: -1  // Thực thi ưu tiên
sort: 0   // Thứ tự mặc định
sort: 1   // Thực thi sau
```

### on

**Kiểu**: `FlowEvent<TModel>`  
**Bắt buộc**: Không  
**Mô tả**: Cấu hình Event cho phép Flow này được kích hoạt bởi `dispatchEvent`

Dùng để khai báo tên Event kích hoạt (chuỗi hoặc `{ eventName }`), cùng thời điểm thực thi tùy chọn (`phase`). Không bao gồm hàm xử lý (logic xử lý nằm trong `steps`).

**Các kiểu Event hỗ trợ**:
- `'beforeRender'` - Event trước khi render, tự động kích hoạt khi component render lần đầu
- `'click'` - Event click
- `'submit'` - Event submit
- `'reset'` - Event reset
- `'remove'` - Event xóa
- `'openView'` - Event mở view
- `'dropdownOpen'` - Event mở dropdown
- `'popupScroll'` - Event cuộn popup
- `'search'` - Event tìm kiếm
- `'customRequest'` - Event request tùy chỉnh
- `'collapseToggle'` - Event toggle thu gọn
- Hoặc bất kỳ chuỗi tùy chỉnh nào

**Ví dụ**:
```ts
on: 'click'  // Kích hoạt khi click
on: 'submit' // Kích hoạt khi submit
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

#### Thời điểm thực thi (phase)

Khi cùng một Event (ví dụ `click`) có nhiều event flow, có thể dùng `phase / flowKey / stepKey` để chỉ định Flow này được chèn vào vị trí nào trong các Flow tĩnh tích hợp:

| phase | Ý nghĩa | Trường cần có |
| --- | --- | --- |
| `beforeAllFlows`(mặc định) | Thực thi trước tất cả các Flow tĩnh tích hợp | - |
| `afterAllFlows` | Thực thi sau tất cả các Flow tĩnh tích hợp | - |
| `beforeFlow` | Thực thi trước khi một Flow tĩnh tích hợp bắt đầu | `flowKey` |
| `afterFlow` | Thực thi sau khi một Flow tĩnh tích hợp kết thúc | `flowKey` |
| `beforeStep` | Thực thi trước khi một Step của Flow tĩnh tích hợp bắt đầu | `flowKey` + `stepKey` |
| `afterStep` | Thực thi sau khi một Step của Flow tĩnh tích hợp kết thúc | `flowKey` + `stepKey` |

**Ví dụ**:

```ts
// 1) Mặc định: Trước tất cả các Flow tĩnh tích hợp (không cần ghi phase)
on: { eventName: 'click' }

// 2) Sau tất cả các Flow tĩnh tích hợp
on: { eventName: 'click', phase: 'afterAllFlows' }

// 3) Trước/sau khi một Flow tĩnh tích hợp bắt đầu/kết thúc
on: { eventName: 'click', phase: 'beforeFlow', flowKey: 'buttonSettings' }
on: { eventName: 'click', phase: 'afterFlow', flowKey: 'buttonSettings' }

// 4) Trước/sau khi một Step của Flow tĩnh tích hợp bắt đầu/kết thúc
on: { eventName: 'click', phase: 'beforeStep', flowKey: 'buttonSettings', stepKey: 'general' }
on: { eventName: 'click', phase: 'afterStep', flowKey: 'buttonSettings', stepKey: 'general' }
```

### steps

**Kiểu**: `Record<string, StepDefinition<TModel>>`  
**Bắt buộc**: Có  
**Mô tả**: Định nghĩa các Step của Flow

Định nghĩa tất cả các Step có trong Flow, mỗi Step có một key duy nhất.

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
**Mô tả**: Tham số mặc định cấp Flow

Khi khởi tạo Model (createModel), điền giá trị khởi tạo cho tham số Step của "Flow hiện tại". Chỉ điền các giá trị thiếu, không ghi đè giá trị đã có. Hình dạng trả về cố định: `{ [stepKey]: params }`

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
