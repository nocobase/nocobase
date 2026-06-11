---
title: "Import module trong RunJS"
description: "Import module trong RunJS: ctx.libs có sẵn React/antd/dayjs/formula, ctx.importAsync tải động ESM, ctx.requireAsync UMD, cấu hình CDN esm.sh."
keywords: "import module,ctx.libs,ctx.importAsync,ctx.requireAsync,ESM,esm.sh,NocoBase RunJS"
---

# Import module

Trong RunJS có thể sử dụng hai loại module: **module có sẵn** (sử dụng trực tiếp qua `ctx.libs`, không cần import) và **module bên ngoài** (tải theo nhu cầu qua `ctx.importAsync()` hoặc `ctx.requireAsync()`).

---

## Module có sẵn - ctx.libs (không cần import)

RunJS đã tích hợp sẵn các thư viện thường dùng, có thể truy cập trực tiếp qua `ctx.libs`, **không cần** `import` hoặc tải bất đồng bộ.

| Thuộc tính | Mô tả |
|------|------|
| **ctx.libs.React** | React core, dùng cho JSX và Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (có thể dùng kết hợp với createRoot nếu cần) |
| **ctx.libs.antd** | Thư viện component Ant Design |
| **ctx.libs.antdIcons** | Icon Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): biểu thức toán học, phép toán ma trận, v.v. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): công thức kiểu Excel (SUM, AVERAGE, v.v.) |

### Ví dụ: React và antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>点击</Button>);
```

### Ví dụ: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Ví dụ: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Module bên ngoài

Khi cần thư viện bên thứ ba, hãy chọn cách tải dựa trên định dạng module:

- **Module ESM** → sử dụng `ctx.importAsync()`
- **Module UMD/AMD** → sử dụng `ctx.requireAsync()`

---

### Import module ESM

Sử dụng **`ctx.importAsync()`** để tải động module ESM theo URL, phù hợp với các kịch bản như JS Block, JS Field, JS Action.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Địa chỉ module ESM. Hỗ trợ định dạng rút gọn `<tên gói>@<phiên bản>` hoặc với đường dẫn con `<tên gói>@<phiên bản>/<đường dẫn file>` (ví dụ `vue@3.4.0`, `lodash@4/lodash.js`), sẽ được nối với prefix CDN theo cấu hình; cũng hỗ trợ URL đầy đủ.
- **Trả về**: Đối tượng namespace của module sau khi parse.

#### Mặc định là https://esm.sh

Khi chưa cấu hình, dạng rút gọn sẽ sử dụng **https://esm.sh** làm prefix CDN. Ví dụ:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// tương đương với việc tải từ https://esm.sh/vue@3.4.0
```

#### Tự host service esm.sh

Nếu cần CDN nội bộ hoặc tự host, bạn có thể triển khai service tương thích với giao thức esm.sh và chỉ định qua biến môi trường:

- **ESM_CDN_BASE_URL**: Địa chỉ cơ sở của ESM CDN (mặc định `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Hậu tố tùy chọn (ví dụ `/+esm` của jsDelivr)

Tham khảo dịch vụ tự host: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Import module UMD/AMD

Sử dụng **`ctx.requireAsync()`** để tải bất đồng bộ theo URL các script UMD/AMD hoặc gắn vào global.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Hỗ trợ hai dạng:
  - **Đường dẫn rút gọn**: `<tên gói>@<phiên bản>/<đường dẫn file>`, giống như `ctx.importAsync()`, sẽ được parse theo cấu hình ESM CDN hiện tại; khi parse sẽ thêm `?raw`, yêu cầu trực tiếp file gốc của đường dẫn này (thường là build UMD). Ví dụ `echarts@5/dist/echarts.min.js` thực tế yêu cầu `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (khi mặc định dùng esm.sh).
  - **URL đầy đủ**: Địa chỉ đầy đủ của bất kỳ CDN nào (ví dụ `https://cdn.jsdelivr.net/npm/xxx`).
- **Trả về**: Đối tượng thư viện sau khi tải (dạng cụ thể tùy theo cách export của thư viện đó)

Sau khi tải, nhiều thư viện UMD sẽ gắn vào đối tượng global (ví dụ `window.xxx`), khi sử dụng có thể tham khảo tài liệu của thư viện đó.

**Ví dụ**

```ts
// Đường dẫn rút gọn (qua esm.sh parse thành ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL đầy đủ
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Lưu ý**: Nếu thư viện cũng cung cấp phiên bản ESM, ưu tiên sử dụng `ctx.importAsync()` để có ngữ nghĩa module và Tree-shaking tốt hơn.
