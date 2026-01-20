:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# EventDefinition

EventDefinition định nghĩa logic xử lý sự kiện trong một luồng công việc, dùng để phản hồi các sự kiện kích hoạt cụ thể. Các sự kiện là một cơ chế quan trọng trong FlowEngine để kích hoạt việc thực thi luồng công việc.

## Định nghĩa kiểu

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition thực chất là một bí danh của ActionDefinition, do đó nó có cùng các thuộc tính và phương thức.

## Phương thức đăng ký

```ts
// Đăng ký toàn cục (qua FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logic xử lý sự kiện
  }
});

// Đăng ký cấp mô hình (qua FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logic xử lý sự kiện
  }
});

// Sử dụng trong luồng công việc
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Tham chiếu một sự kiện đã đăng ký
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Mô tả thuộc tính

### name

**Kiểu**: `string`  
**Bắt buộc**: Có  
**Mô tả**: Định danh duy nhất cho sự kiện.

Dùng để tham chiếu sự kiện trong một luồng công việc thông qua thuộc tính `on`.

**Ví dụ**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Kiểu**: `string`  
**Bắt buộc**: Không  
**Mô tả**: Tiêu đề hiển thị cho sự kiện.

Dùng cho việc hiển thị giao diện người dùng (UI) và gỡ lỗi.

**Ví dụ**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Kiểu**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Bắt buộc**: Có  
**Mô tả**: Hàm xử lý cho sự kiện.

Đây là logic cốt lõi của sự kiện, nhận ngữ cảnh và các tham số, sau đó trả về kết quả xử lý.

**Ví dụ**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Thực thi logic xử lý sự kiện
    const result = await handleEvent(params);
    
    // Trả về kết quả
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**Kiểu**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Bắt buộc**: Không  
**Mô tả**: Các tham số mặc định cho sự kiện.

Điền các giá trị mặc định cho tham số khi sự kiện được kích hoạt.

**Ví dụ**:
```ts
// Tham số mặc định tĩnh
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Tham số mặc định động
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Tham số mặc định bất đồng bộ
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Kiểu**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Bắt buộc**: Không  
**Mô tả**: Schema cấu hình UI cho sự kiện.

Định nghĩa cách sự kiện hiển thị trong giao diện người dùng và cấu hình biểu mẫu.

**Ví dụ**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Ngăn chặn mặc định',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Ngừng lan truyền',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Dữ liệu tùy chỉnh',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Khóa',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Giá trị',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Kiểu**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Bắt buộc**: Không  
**Mô tả**: Hàm hook được thực thi trước khi lưu các tham số.

Được thực thi trước khi các tham số sự kiện được lưu, có thể dùng để xác thực hoặc chuyển đổi tham số.

**Ví dụ**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Xác thực tham số
  if (!params.eventType) {
    throw new Error('Loại sự kiện là bắt buộc');
  }
  
  // Chuyển đổi tham số
  params.eventType = params.eventType.toLowerCase();
  
  // Ghi lại thay đổi
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Kiểu**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Bắt buộc**: Không  
**Mô tả**: Hàm hook được thực thi sau khi lưu các tham số.

Được thực thi sau khi các tham số sự kiện được lưu, có thể dùng để kích hoạt các hành động khác.

**Ví dụ**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Ghi nhật ký
  console.log('Event params saved:', params);
  
  // Kích hoạt sự kiện
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Cập nhật bộ nhớ đệm
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Kiểu**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Bắt buộc**: Không  
**Mô tả**: Chế độ hiển thị UI cho sự kiện.

Kiểm soát cách sự kiện được hiển thị trong giao diện người dùng.

**Các chế độ được hỗ trợ**:
- `'dialog'` - Chế độ hộp thoại
- `'drawer'` - Chế độ ngăn kéo
- `'embed'` - Chế độ nhúng
- Hoặc một đối tượng cấu hình tùy chỉnh

**Ví dụ**:
```ts
// Chế độ đơn giản
uiMode: 'dialog'

// Cấu hình tùy chỉnh
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Cấu hình sự kiện'
  }
}

// Chế độ động
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Các loại sự kiện tích hợp

FlowEngine đã tích hợp sẵn các loại sự kiện phổ biến sau:

- `'click'` - Sự kiện nhấp chuột
- `'submit'` - Sự kiện gửi
- `'reset'` - Sự kiện đặt lại
- `'remove'` - Sự kiện xóa
- `'openView'` - Sự kiện mở chế độ xem
- `'dropdownOpen'` - Sự kiện mở danh sách thả xuống
- `'popupScroll'` - Sự kiện cuộn cửa sổ bật lên
- `'search'` - Sự kiện tìm kiếm
- `'customRequest'` - Sự kiện yêu cầu tùy chỉnh
- `'collapseToggle'` - Sự kiện bật/tắt thu gọn

## Ví dụ đầy đủ

```ts
class FormModel extends FlowModel {}

// Đăng ký sự kiện gửi biểu mẫu
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Sự kiện gửi biểu mẫu',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Xác thực dữ liệu biểu mẫu
      if (validation && !validateFormData(formData)) {
        throw new Error('Xác thực biểu mẫu thất bại');
      }
      
      // Xử lý việc gửi biểu mẫu
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Biểu mẫu đã được gửi thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Bật xác thực',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Ngăn chặn mặc định',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Ngừng lan truyền',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Bộ xử lý tùy chỉnh',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Tên bộ xử lý',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Đã bật',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Dữ liệu biểu mẫu là bắt buộc khi xác thực được bật');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Đăng ký sự kiện thay đổi dữ liệu
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Sự kiện thay đổi dữ liệu',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Ghi lại thay đổi dữ liệu
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Kích hoạt các hành động liên quan
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Thay đổi dữ liệu đã được ghi nhật ký thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// Sử dụng sự kiện trong luồng công việc
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Xử lý biểu mẫu',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Xác thực biểu mẫu',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Xử lý biểu mẫu',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Lưu biểu mẫu',
      sort: 2
    }
  }
});