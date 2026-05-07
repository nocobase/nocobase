---
title: "Điểm mở rộng Plugin RunJS"
description: "Điểm mở rộng Plugin RunJS: tài liệu ctx, đoạn code snippets, mapping ngữ cảnh, mở rộng trải nghiệm phát triển RunJS, mở rộng JS Model FlowEngine."
keywords: "Điểm mở rộng RunJS,Tài liệu ctx,snippets,Mapping ngữ cảnh,JS Model,FlowEngine,NocoBase"
---

# Điểm mở rộng Plugin RunJS (Tài liệu ctx / snippets / mapping ngữ cảnh)

Khi Plugin thêm hoặc mở rộng năng lực RunJS, khuyến nghị thông qua **các điểm mở rộng chính thức** để đăng ký "mapping context / tài liệu `ctx` / code mẫu" cùng vào, cho phép:

- CodeEditor có thể tự động hoàn thành `ctx.xxx.yyy`
- AI coding có thể có được tham chiếu API `ctx` có cấu trúc + ví dụ

Chương này giới thiệu hai điểm mở rộng:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Dùng để đăng ký "đóng góp" (contribution) của RunJS, mục đích điển hình:

- Thêm/Ghi đè mapping `RunJSContextRegistry` (modelClass -> RunJSContext, bao gồm `scenes`)
- Mở rộng `RunJSDocMeta` cho `FlowRunJSContext` hoặc RunJSContext tùy chỉnh (mô tả/ví dụ/template hoàn thành của API `ctx`)

### Mô tả hành vi

- contribution sẽ được thực thi thống nhất trong giai đoạn `setupRunJSContexts()`;
- Nếu `setupRunJSContexts()` đã hoàn thành, **đăng ký muộn sẽ thực thi ngay một lần** (không cần chạy lại setup);
- Mỗi contribution **chỉ thực thi tối đa một lần** cho mỗi `RunJSVersion`.

### Ví dụ: Thêm một context model có thể viết JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Tài liệu ctx/hoàn thành (RunJSDocMeta)
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

  // 2) Mapping model -> context (scene ảnh hưởng đến lọc hoàn thành/snippets của editor)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Dùng để đăng ký các đoạn code mẫu (snippets) của RunJS, dùng để:

- Hoàn thành snippet của CodeEditor
- Làm tài liệu mẫu/tham khảo cho AI coding (có thể cắt theo ngữ cảnh/phiên bản/locale)

### Khuyến nghị đặt tên ref

Khuyến nghị dùng: `plugin/<pluginName>/<topic>`, ví dụ:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Tránh xung đột với `global/*`, `scene/*` của core.

### Chính sách xung đột

- Mặc định không ghi đè `ref` đã có (trả về `false`, nhưng không throw error)
- Khi cần ghi đè thì truyền tường minh `{ override: true }`

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

## 3. Best practices

- **Bảo trì phân tầng tài liệu + snippets**:
  - `RunJSDocMeta`: Mô tả/template hoàn thành (ngắn, có cấu trúc)
  - snippets: Ví dụ dài (có thể tái sử dụng, có thể lọc theo scene/version)
- **Tránh prompt quá dài**: Ví dụ không nên quá nhiều, ưu tiên tập trung vào "template tối thiểu có thể chạy".
- **Ưu tiên ngữ cảnh**: Nếu code JS của bạn chủ yếu chạy trong các ngữ cảnh form/bảng, hãy cố gắng điền đúng `scenes`, nâng cao mức độ liên quan của hoàn thành và ví dụ.

## 4. Ẩn hoàn thành dựa trên ctx thực tế: `hidden(ctx)`

Một số API `ctx` có tính ngữ cảnh mạnh (ví dụ `ctx.popup` chỉ khả dụng khi dialog/drawer được mở). Khi bạn muốn ẩn các API không khả dụng này khi hoàn thành, có thể định nghĩa `hidden(ctx)` cho mục tương ứng trong `RunJSDocMeta`:

- Trả về `true`: Ẩn node hiện tại và cây con của nó
- Trả về `string[]`: Ẩn các đường dẫn con đã chỉ định dưới node hiện tại (hỗ trợ trả về nhiều đường dẫn cùng lúc; đường dẫn là tương đối; ẩn cây con theo khớp tiền tố)

`hidden(ctx)` hỗ trợ async: Bạn có thể dùng `await ctx.getVar('ctx.xxx')` để đánh giá (do người dùng tự quyết định). Khuyến nghị nhanh, không có side effect (không gửi network request).

Ví dụ: Chỉ hiển thị hoàn thành `ctx.popup.*` khi tồn tại `popup.uid`

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

Ví dụ: popup khả dụng nhưng ẩn một số đường dẫn con (chỉ đường dẫn tương đối; ví dụ ẩn `record` và `parent.record`)

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

Mô tả: CodeEditor luôn bật lọc hoàn thành dựa trên `ctx` thực tế (fail-open, không throw error).

## 5. `info/meta` runtime và API thông tin context (cho hoàn thành và LLM)

Ngoài việc bảo trì tài liệu `ctx` qua `FlowRunJSContext.define()` (tĩnh), bạn cũng có thể tiêm **info/meta** khi runtime thông qua `FlowContext.defineProperty/defineMethod`, và xuất ra thông tin context **có thể serialize** thông qua các API sau, dành cho CodeEditor/LLM sử dụng:

- `await ctx.getApiInfos(options?)`: Thông tin API tĩnh
- `await ctx.getVarInfos(options?)`: Thông tin cấu trúc biến (nguồn `meta`, hỗ trợ mở rộng path/maxDepth)
- `await ctx.getEnvInfos()`: Snapshot môi trường runtime

### 5.1 `defineMethod(name, fn, info?)`

`info` hỗ trợ (đều tùy chọn):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (giống JSDoc)

> Lưu ý: Đầu ra của `getApiInfos()` là tài liệu API tĩnh, không bao gồm các trường `deprecated` / `disabled` / `disabledReason`.

Ví dụ: Cung cấp link tài liệu cho `ctx.refreshTargets()`

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Làm mới dữ liệu của Block đích',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Dùng cho UI chọn biến (`getPropertyMetaTree` / `FlowContextSelector`), quyết định có hiển thị, cấu trúc cây, vô hiệu hóa, v.v. (hỗ trợ hàm/async).
  - Trường phổ biến: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Dùng cho tài liệu API tĩnh (`getApiInfos`) và mô tả hướng đến LLM, không ảnh hưởng UI chọn biến (hỗ trợ hàm/async).
  - Trường phổ biến: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Khi chỉ cung cấp `meta` (không cung cấp `info`):

- `getApiInfos()` sẽ không trả về key này (vì tài liệu API tĩnh không suy diễn từ `meta`)
- `getVarInfos()` sẽ xây dựng cấu trúc biến dựa trên `meta` (dùng cho cây biến chọn/biến động)

### 5.3 API thông tin context

Dùng để xuất ra "thông tin năng lực context khả dụng", hình dạng trả về theo phương án A (không bao thêm một lớp `{ apis/envs/... }`).

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Có thể dùng trực tiếp cho await ctx.getVar(getVar), khuyến nghị bắt đầu bằng "ctx."
  value?: any; // Giá trị tĩnh đã parse (có thể serialize, chỉ trả về khi suy diễn được)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Tài liệu tĩnh (một lớp trên cùng)
type FlowContextVarInfos = Record<string, any>; // Cấu trúc biến (có thể mở rộng theo path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Tham số phổ biến:

- `getApiInfos({ version })`: Phiên bản tài liệu RunJS (mặc định `v1`)
- `getVarInfos({ path, maxDepth })`: Cắt và cấp mở rộng tối đa (mặc định 3)

Lưu ý: Kết quả trả về của các API trên đều không chứa hàm, phù hợp để serialize trực tiếp truyền cho LLM.

### 5.4 `await ctx.getVar(path)`

Khi bạn chỉ có một "chuỗi đường dẫn biến" (ví dụ đến từ cấu hình/đầu vào người dùng), muốn lấy trực tiếp giá trị runtime của biến đó, có thể dùng `getVar`:

- Ví dụ: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` là đường dẫn biểu thức bắt đầu bằng `ctx.` (ví dụ `ctx.record.id` / `ctx.record.roles[0].id`)

Ngoài ra: Các phương thức/thuộc tính bắt đầu bằng dấu gạch dưới `_` được coi là thành viên private, sẽ không xuất hiện trong đầu ra của `getApiInfos()` / `getVarInfos()`.
