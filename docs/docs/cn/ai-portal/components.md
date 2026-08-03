---
title: "标准组件与扩展"
description: "AI Portal 基于 shadcn/ui 的组件基座，以及装完即用的扩展机制——每个扩展一个目录，自动发现自动挂载。"
keywords: "AI Portal,shadcn/ui,组件,扩展,AppExtension,Registry,Tailwind CSS"
---

# 标准组件与扩展

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 模式开发快速开始](./index.md) 跑通了第一个 Portal。

:::

Portal 的界面由两部分组成：`src/components/ui` 提供基础组件，`src/extensions` 放业务模块。这一页讲这两部分怎么用。

## 组件基座

`src/components/ui` 下有 60 多个 [shadcn/ui](https://ui.shadcn.com/) 组件——按钮、表单、对话框、抽屉、表格、图表等常用的都有。样式风格在 `components.json` 里配置，图标用 lucide。

跟引入一个组件库不同，**这些组件的源码归项目所有**。它们就在你的仓库里，可以随便改，上游更新也不会自动覆盖。

正因如此，定制时建议用组合而不是直接改：

```tsx
// 推荐：包一层，保留基础组件的可替换性
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

直接改 `src/components/ui/button.tsx` 也能达到目的，不过之后想从上游同步 bug 修复就麻烦了。确实需要改基础组件时，先跟上游版本对比一下，有选择地合并，不要整个覆盖掉本地的改动。

:::warning 注意

不要在 Portal 里引入 Ant Design，或者 NocoBase 基于 Ant Design 的客户端组件。Portal 的样式体系是 Tailwind CSS 加 shadcn/ui，混用会导致样式冲突。这条约定已经写在模板的 `AGENTS.md` 里。

:::

## 扩展机制

业务功能写成扩展，放在 `src/extensions/` 下，一个功能模块一个目录：

```text
src/extensions/
├── nocobase-acl/               权限组件
├── nocobase-ai/                AI 对话能力
├── nocobase-route-surfaces/    页面、抽屉、弹窗三种路由载体
└── nocobase-users-example/     用户管理示例
```

每个目录里有一个 `extension.tsx`，默认导出一个 `AppExtension`。模板会自动扫描并装载——**放进目录就生效，不需要改任何注册代码**。

## AppExtension

一个扩展可以提供这些东西：

| 字段 | 说明 |
| --- | --- |
| `id` | 扩展标识，必填 |
| `priority` | 装载顺序，数字小的靠前，默认 100 |
| `resources` | Refine 资源定义，决定导航菜单和路由映射 |
| `routes` | 路由元素，会挂到已登录的路由树下 |
| `Provider` | 包裹整个应用的 Provider |
| `AuthRuntimeProvider` | 认证运行时 Provider，在登录前就生效 |
| `UserMenuItems` | 往用户菜单里加条目 |
| `authAdapters` | 认证方式适配器 |
| `dev` | 只在开发模式下生效的资源和路由 |

一个最小的扩展长这样：

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // 参与 NocoBase 的数据表权限判断
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## 内置扩展

模板自带四个扩展，可以直接用，也是写新代码时最好的参考：

**`nocobase-users-example`** — 基于 NocoBase 标准 `users` 表的完整增删改查模块，列表、创建、编辑、详情都有。做新页面时让 AI 照着它写。

**`nocobase-acl`** — 权限组件，`CanAccess`、`AclPage`、`AclRegion`、`AclField`、`RoleSwitcher` 都在这里。

**`nocobase-route-surfaces`** — 三种路由载体：整页、抽屉和弹窗。同一个内容既能作为独立页面打开，也能在列表页里以抽屉形式弹出，路由状态会正确同步。

**`nocobase-ai`** — 把 NocoBase 的 AI 对话能力接到前端，包括对话窗口、流式传输、会话历史和页面上下文。用它可以在自己的 Portal 里做一个 AI 助手。

## 引用规则

写扩展时有两条路径约定：

- 引用宿主应用的东西用 `@/` 别名，比如 `@/components/ui/button`
- 扩展内部的相对引用不要跨出自己的目录

这样每个扩展都是自包含的，可以整个目录复制到另一个 Portal 里继续用。

## 可安装的官方扩展

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

除了内置的四个，NocoBase 还会提供一批可按需安装的官方扩展。安装后源码会落到 `src/extensions/` 下，跟内置扩展一样成为项目自有代码，可以修改并随应用提交。

## 国际化

文案放在 `src/locales/`，模板自带中英文。扩展也可以有自己的语言包，在扩展目录里建 `locales/` 然后在 `extension.tsx` 里导入即可。

## 相关链接

- [AI 模式开发快速开始](./index.md) — 跑通第一个由 AI 编写的前端入口
- [项目结构与技术栈](./project-structure.md) — 完整的目录约定和常用命令
- [与 AI Agent 协作搭建](./agent-workflow.md) — 让 AI 照着内置扩展写新模块
