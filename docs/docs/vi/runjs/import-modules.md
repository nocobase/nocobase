:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/import-modules).
:::

# Nhập mô-đun

Trong RunJS, bạn có thể sử dụng hai loại mô-đun: **Mô-đun tích hợp sẵn** (sử dụng trực tiếp qua `ctx.libs`, không cần import) và **Mô-đun bên ngoài** (tải theo nhu cầu qua `ctx.importAsync()` hoặc `ctx.requireAsync()`).

---

## Mô-đun tích hợp sẵn - ctx.libs (Không cần import)

RunJS tích hợp sẵn các thư viện phổ biến, có thể truy cập trực tiếp thông qua `ctx.libs` mà **không cần** sử dụng `import` hoặc tải bất đồng bộ.

| Thuộc tính | Mô tả |
|------|------|
| **ctx.libs.React** | React core, dùng cho JSX và Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (có thể phối hợp sử dụng khi cần `createRoot`, v.v.) |
| **ctx.libs.antd** | Thư viện thành phần Ant Design |
| **ctx.libs.antdIcons** | Biểu tượng Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Biểu thức toán học, phép toán ma trận, v.v. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Các công thức kiểu Excel (SUM, AVERAGE, v.v.) |

### Ví dụ: React và antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Nhấp vào đây</Button>);
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

## Mô-đun bên ngoài

Khi cần các thư viện bên thứ ba, hãy chọn phương thức tải dựa trên định dạng mô-đun:

- **Mô-đun ESM** → Sử dụng `ctx.importAsync()`
- **Mô-đun UMD/AMD** → Sử dụng `ctx.requireAsync()`

---

### Nhập mô-đun ESM

Sử dụng **`ctx.importAsync()`** để tải động các mô-đun ESM theo URL, phù hợp cho các kịch bản như khối JS, trường dữ liệu JS, thao tác JS, v.v.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Địa chỉ mô-đun ESM. Hỗ trợ định dạng viết tắt `<tên gói>@<phiên bản>` hoặc đường dẫn con `<tên gói>@<phiên bản>/<đường dẫn tệp>` (ví dụ: `vue@3.4.0`, `lodash@4/lodash.js`), hệ thống sẽ tự động ghép tiền tố CDN theo cấu hình; cũng hỗ trợ URL đầy đủ.
- **Trả về**: Đối tượng namespace của mô-đun đã được phân giải.

#### Mặc định là https://esm.sh

Khi không được cấu hình, dạng viết tắt sẽ sử dụng **https://esm.sh** làm tiền tố CDN. Ví dụ:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Tương đương với việc tải từ https://esm.sh/vue@3.4.0
```

#### Tự triển khai dịch vụ esm.sh

Nếu cần sử dụng mạng nội bộ hoặc CDN tự xây dựng, bạn có thể triển khai dịch vụ tương thích với giao thức esm.sh và chỉ định thông qua các biến môi trường:

- **ESM_CDN_BASE_URL**: Địa chỉ cơ sở của ESM CDN (mặc định là `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Hậu tố tùy chọn (ví dụ: `/+esm` của jsDelivr)

Để tự triển khai dịch vụ, tham khảo: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Nhập mô-đun UMD/AMD

Sử dụng **`ctx.requireAsync()`** để tải bất đồng bộ các mô-đun UMD/AMD hoặc các tập lệnh được gắn vào đối tượng toàn cục.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Hỗ trợ hai dạng:
  - **Đường dẫn viết tắt**: `<tên gói>@<phiên bản>/<đường dẫn tệp>`, tương tự như `ctx.importAsync()`, sẽ được phân giải theo cấu hình ESM CDN hiện tại; khi phân giải sẽ được thêm `?raw` để yêu cầu trực tiếp tệp gốc của đường dẫn đó (thường là bản build UMD). Ví dụ `echarts@5/dist/echarts.min.js` thực tế sẽ yêu cầu `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (khi sử dụng esm.sh mặc định).
  - **URL đầy đủ**: Địa chỉ đầy đủ của bất kỳ CDN nào (ví dụ: `https://cdn.jsdelivr.net/npm/xxx`).
- **Trả về**: Đối tượng thư viện sau khi tải (hình thức cụ thể phụ thuộc vào cách xuất của thư viện đó).

Sau khi tải, nhiều thư viện UMD sẽ được gắn vào đối tượng toàn cục (như `window.xxx`), bạn có thể sử dụng theo tài liệu của thư viện đó.

**Ví dụ**

```ts
// Đường dẫn viết tắt (được phân giải qua esm.sh thành ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL đầy đủ
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Lưu ý**: Nếu thư viện cung cấp cả phiên bản ESM, hãy ưu tiên sử dụng `ctx.importAsync()` để có ngữ nghĩa mô-đun tốt hơn và hỗ trợ Tree-shaking.