---
title: "ctx.importAsync() vs ctx.requireAsync()"
description: "对比两种动态加载库的方法，帮助选择合适的加载方式。"
---

# ctx.importAsync() vs ctx.requireAsync()

## 核心区别

| 特性 | `ctx.importAsync()` | `ctx.requireAsync()` |
|------|---------------------|----------------------|
| **模块格式** | ESM（ES Module） | UMD/AMD/全局库 |
| **底层实现** | 原生 `dynamic import()` | RequireJS |
| **返回结果** | 模块命名空间对象（包含 `default` 和命名导出） | 库对象（取决于库的导出方式） |
| **全局污染** | 不污染全局作用域 | 挂载到 `window` 对象上，有可能全局污染 |
| **现代性** | ✅ 现代标准，推荐使用 | ⚠️ 传统方式，兼容旧库 |
| **适用场景** | 现代 ESM 库（如 @fullcalendar/core、tabulator-tables） | 传统 UMD 库（如 jQuery 插件、旧版 FullCalendar） |

## 使用建议

### 使用 `ctx.importAsync()`

- ✅ 库提供 ESM 格式（通常 CDN 支持 `+esm` 后缀）
- ✅ 需要树摇（tree-shaking）优化
- ✅ 希望避免全局命名空间污染
- ✅ 使用现代库（如 FullCalendar 6、Tabulator 6+）

**示例：**
```ts
// 加载 ESM 模块
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');
```

### 使用 `ctx.requireAsync()`

- ✅ 库只提供 UMD/AMD 格式
- ✅ 库需要挂载到全局对象（如 `window.jQuery`、`window.FullCalendar`）
- ✅ 使用传统/旧版库（如 jQuery 插件、FullCalendar 5.x）

**示例：**
```ts
// 加载 UMD 库（会挂载到 window.FullCalendar）
await ctx.requireAsync('fullcalendar@5.11.5/index.global.min.js');
const calendar = new FullCalendar.Calendar(calendarEl, { ... });
```

## 技术细节

### `ctx.importAsync()` 实现

- 使用原生 `dynamic import()` API
- 有缓存机制，相同 URL 只加载一次
- 返回标准的 ESM 模块对象

### `ctx.requireAsync()` 实现

- 基于 RequireJS 加载器
- 适合 AMD/UMD 格式的模块
- 库可能直接挂载到 `window` 对象
- 需要 RequireJS 环境支持

## 迁移建议

如果库同时提供 ESM 和 UMD 版本，**优先使用 `ctx.importAsync()`**：

```ts
// ❌ 旧方式（UMD）
await ctx.requireAsync('/library@1.0.0/dist/library.min.js');
const Lib = window.Library;

// ✅ 新方式（ESM）
const Lib = await ctx.importAsync('library@1.0.0');
```

> 提示：
> - RunJS 中的脚本支持直接使用 `await`，建议在开头统一通过 `ctx.importAsync()` 和 `ctx.requireAsync()` 引入所需依赖
> - 大多数现代 CDN（如 jsDelivr）支持通过在 URL 中添加 `+esm` 后缀，将库自动转换为 ESM 模块格式
> - 如果库只提供 UMD 版本，则必须使用 `ctx.requireAsync()` 进行加载。
> - 不确定时，可以先尝试 `ctx.importAsync()`，失败后再使用 `ctx.requireAsync()`
