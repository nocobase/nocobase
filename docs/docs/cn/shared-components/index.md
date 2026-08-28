---
title: "公共组件"
description: "NocoBase client-v2 公共组件：表单容器、表单字段、筛选、表格和图标组件的使用入口。"
keywords: "client-v2,公共组件,React,Antd,DrawerFormLayout,RemoteSelect,CollectionFilter,Table,NocoBase"
---

# 公共组件

NocoBase client v2 内置了一批公共组件。写插件页面、设置页或表单时，可以直接使用这些组件，复用 NocoBase 已经准备好的 UI 和交互。

## 快速索引

| 我想要…… | 去哪里看 |
| --- | --- |
| 控制底层全屏扫码器 | [CodeScanner](./form/code-scanner) |
| 在 dialog 里放一个标准表单 | [DialogFormLayout](./form/dialog-form-layout) |
| 在 drawer 里放一个标准表单 | [DrawerFormLayout](./form/drawer-form-layout) |
| 只允许选择 `$env` 环境变量 | [EnvVariableInput](./form/env-variable-input) |
| 输入文件大小并统一保存为字节数 | [FileSizeInput](./form/file-size-input) |
| 编辑 JSON / JSON5 配置 | [JsonTextArea](./form/json-text-area) |
| 密码输入并显示强度提示 | [PasswordInput](./form/password-input) |
| 从接口异步加载 Select 选项 | [RemoteSelexct](./form/remote-select) |
| 输入框里支持扫码 | [ScanInput](./form/scan-input) |
| 让字段同时支持常量和变量 | [TypedVariableInput](./form/typed-variable-input) |
| 让单行字段支持 `{{ $env.X }}`、`{{ $user.name }}` 这类变量 | [VariableInput](./form/variable-input) |
| 在 JSON / JSON5 配置中插入变量 | [VariableJsonTextArea](./form/variable-json-text-area) |
| 让多行文本支持变量 | [VariableTextArea](./form/variable-text-area) |
| 给 Collection 做多条件筛选 | [CollectionFilter](./filter/) |
| 把 Collection 筛选面板嵌入页面 | [CollectionFilterPanel](./filter/collection-filter-panel) |
| 自定义 antd Table 拖拽行 | [SortableRow](./table/sortable-row) |
| 自定义 Table 拖拽手柄列 | [SortHandle](./table/sort-handle) |
| 在设置页里展示列表、选择行、拖拽排序 | [Table](./table/) |
| 使用 Ant Design 图标或注册自定义图标 | [Icon](./icon) |
| 给插件内部扩展项做注册表 | [createFormRegistry](./create-form-registry) |

## 使用方式

在客户端插件中按需引入组件，然后像普通 React 组件一样使用：

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## 选用建议

默认用 React + Antd 写页面就行。遇到下面这些 NocoBase 插件里的高频场景时，再优先查这里的组件：

- 设置页里要打开 drawer / dialog 表单
- 表单字段需要插入变量、编辑 JSON、输入文件大小或支持扫码
- 列表页需要 Collection 筛选或拖拽排序
- 需要使用 NocoBase 统一图标入口

如果只是普通输入框、按钮、提示信息，直接用 Antd 组件更直接。

## 相关链接

- [Component 组件开发](../plugin-development/client/component/index.md) — 普通 React 组件的写法
- [Context 常用能力](../plugin-development/client/ctx/common-capabilities.md) — 在组件里调用 API、国际化、路由等能力
- [FlowEngine](../flow-engine/index.md) — 需要可视化配置时再使用 FlowModel
