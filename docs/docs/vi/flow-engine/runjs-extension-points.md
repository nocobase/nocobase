:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/flow-engine/runjs-extension-points).
:::

# Điểm mở rộng plugin RunJS (Tài liệu ctx / snippet / ánh xạ ngữ cảnh)

Khi một plugin thêm mới hoặc mở rộng khả năng của RunJS, bạn nên đăng ký "ánh xạ ngữ cảnh (context mapping) / tài liệu `ctx` / mã ví dụ" thông qua các **điểm mở rộng chính thức**. Điều này giúp:

- CodeEditor có thể tự động hoàn thành `ctx.xxx.yyy`.
- AI coding có thể nhận được tài liệu tham khảo API `ctx` và các ví dụ có cấu trúc.

Chương này giới thiệu hai điểm mở rộng:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Được sử dụng để đăng ký các "đóng góp" (contribution) cho RunJS. Các trường hợp sử dụng điển hình:

- Thêm mới/ghi đè ánh xạ `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, bao gồm cả `scenes`).
- Mở rộng `RunJSDocMeta` (mô tả/ví dụ/mẫu hoàn thiện cho API `ctx`) cho `FlowRunJSContext` hoặc RunJSContext tùy chỉnh.

### Mô tả hành vi

- Các đóng góp sẽ được thực thi đồng loạt trong giai đoạn `setupRunJSContexts()`.
- Nếu `setupRunJSContexts()` đã hoàn thành, **việc đăng ký muộn sẽ được thực thi ngay lập tức một lần** (không cần chạy lại setup).
- Mỗi đóng góp sẽ chỉ được thực thi **tối đa một lần** cho mỗi `RunJSVersion`.

### Ví dụ: Thêm một ngữ cảnh model có thể viết JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Tài liệu ctx/tự động hoàn thành (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) Ánh xạ model -> context (scene ảnh hưởng đến việc gợi ý của trình soạn thảo/lọc snippet)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Được sử dụng để đăng ký các đoạn mã mẫu (snippets) cho RunJS, dùng cho:

- Tự động hoàn thành snippet trong CodeEditor.
- Làm tài liệu tham khảo/ví dụ cho AI coding (có thể lọc theo ngữ cảnh/phiên bản/ngôn ngữ).

### Đặt tên ref khuyến nghị

Nên sử dụng định dạng: `plugin/<pluginName>/<topic>`, ví dụ:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Tránh xung đột với các không gian tên `global/*` hoặc `scene/*` của core.

### Chiến lược xung đột

- Theo mặc định, không ghi đè lên `ref` đã tồn tại (trả về `false` nhưng không báo lỗi).
- Khi cần ghi đè, hãy truyền vào `{ override: true }`.

### Ví dụ: Đăng ký một snippet

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. Thực hành tốt nhất

- **Duy trì phân tầng Tài liệu + Snippets**:
  - `RunJSDocMeta`: Mô tả/mẫu hoàn thiện (ngắn gọn, có cấu trúc).
  - Snippets: Ví dụ dài (có thể tái sử dụng, có thể lọc theo scene/phiên bản).
- **Tránh prompt quá dài**: Các ví dụ không nên quá nhiều, ưu tiên tập trung vào "mẫu tối thiểu có thể chạy được".
- **Ưu tiên ngữ cảnh (scene)**: Nếu mã JS của bạn chủ yếu chạy trong các ngữ cảnh như biểu mẫu/bảng, hãy cố gắng điền đúng `scenes` để tăng tính liên quan của gợi ý và ví dụ.

## 4. Ẩn gợi ý dựa trên ctx thực tế: `hidden(ctx)`

Một số API `ctx` có tính ngữ cảnh mạnh mẽ (ví dụ: `ctx.popup` chỉ khả dụng khi cửa sổ bật lên/ngăn kéo đang mở). Khi bạn muốn ẩn các API không khả dụng này trong danh sách gợi ý, bạn có thể định nghĩa `hidden(ctx)` cho mục tương ứng trong `RunJSDocMeta`:

- Trả về `true`: Ẩn nút hiện tại và các nút con của nó.
- Trả về `string[]`: Ẩn các đường dẫn con cụ thể dưới nút hiện tại (hỗ trợ trả về nhiều đường dẫn cùng lúc; đường dẫn là tương đối; ẩn cây con dựa trên khớp tiền tố).

`hidden(ctx)` hỗ trợ async: Bạn có thể sử dụng `await ctx.getVar('ctx.xxx')` để phán đoán (do người dùng tự quyết định). Khuyến nghị nên thực hiện nhanh chóng và không gây tác dụng phụ (không nên gửi yêu cầu mạng).

Ví dụ: Chỉ hiển thị gợi ý `ctx.popup.*` khi tồn tại `popup.uid`

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

Ví dụ: popup khả dụng nhưng ẩn một phần đường dẫn con (chỉ đường dẫn tương đối; ví dụ ẩn `record` và `parent.record`)

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

Lưu ý: CodeEditor luôn bật tính năng lọc gợi ý dựa trên `ctx` thực tế (fail-open, không báo lỗi).

## 5. `info/meta` lúc runtime và API thông tin ngữ cảnh (Dành cho gợi ý và LLM)

Ngoài việc duy trì tài liệu `ctx` thông qua `FlowRunJSContext.define()` (tĩnh), bạn cũng có thể chèn **info/meta** lúc runtime thông qua `FlowContext.defineProperty/defineMethod`, và xuất thông tin ngữ cảnh **có thể tuần tự hóa** thông qua các API sau để CodeEditor/LLM sử dụng:

- `await ctx.getApiInfos(options?)`: Thông tin API tĩnh.
- `await ctx.getVarInfos(options?)`: Thông tin cấu trúc biến (nguồn từ `meta`, hỗ trợ triển khai theo path/maxDepth).
- `await ctx.getEnvInfos()`: Ảnh chụp môi trường thực thi lúc runtime.

### 5.1 `defineMethod(name, fn, info?)`

`info` hỗ trợ (tất cả đều tùy chọn):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (tương tự JSDoc)

> Lưu ý: Kết quả của `getApiInfos()` là tài liệu API tĩnh, sẽ không bao gồm các trường như `deprecated` / `disabled` / `disabledReason`.

Ví dụ: Cung cấp liên kết tài liệu cho `ctx.refreshTargets()`

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Làm mới dữ liệu của các khối mục tiêu',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Dùng cho giao diện bộ chọn biến (`getPropertyMetaTree` / `FlowContextSelector`), quyết định việc hiển thị, cấu trúc cây, vô hiệu hóa, v.v. (hỗ trợ hàm/async).
  - Các trường thường dùng: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Dùng cho tài liệu API tĩnh (`getApiInfos`) và mô tả dành cho LLM, không ảnh hưởng đến giao diện bộ chọn biến (hỗ trợ hàm/async).
  - Các trường thường dùng: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Khi chỉ cung cấp `meta` (không cung cấp `info`):

- `getApiInfos()` sẽ không trả về key này (vì tài liệu API tĩnh không được suy luận từ `meta`).
- `getVarInfos()` sẽ xây dựng cấu trúc biến dựa trên `meta` (dùng cho bộ chọn biến/cây biến động).

### 5.3 API thông tin ngữ cảnh

Dùng để xuất "thông tin khả năng ngữ cảnh khả dụng".

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Có thể dùng trực tiếp cho await ctx.getVar(getVar), khuyến nghị bắt đầu bằng "ctx."
  value?: any; // Giá trị tĩnh đã được phân giải (có thể tuần tự hóa, chỉ trả về khi có thể suy luận)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Tài liệu tĩnh (tầng trên cùng)
type FlowContextVarInfos = Record<string, any>; // Cấu trúc biến (có thể triển khai theo path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Các tham số thường dùng:

- `getApiInfos({ version })`: Phiên bản tài liệu RunJS (mặc định là `v1`).
- `getVarInfos({ path, maxDepth })`: Cắt tỉa và cấp độ triển khai tối đa (mặc định là 3).

Lưu ý: Kết quả trả về của các API trên không bao gồm hàm, phù hợp để tuần tự hóa trực tiếp và truyền cho LLM.

### 5.4 `await ctx.getVar(path)`

Khi bạn chỉ có một "chuỗi đường dẫn biến" (ví dụ từ cấu hình/người dùng nhập vào) và muốn lấy trực tiếp giá trị runtime của biến đó, bạn có thể sử dụng `getVar`:

- Ví dụ: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` là một đường dẫn biểu thức bắt đầu bằng `ctx.` (ví dụ `ctx.record.id` / `ctx.record.roles[0].id`)

Ngoài ra: Các phương thức/thuộc tính bắt đầu bằng dấu gạch dưới `_` sẽ được coi là thành viên riêng tư (private) và sẽ không xuất hiện trong kết quả của `getApiInfos()` / `getVarInfos()`.