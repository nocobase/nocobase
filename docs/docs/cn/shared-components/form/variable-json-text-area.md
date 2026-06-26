---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea：编辑 JSON / JSON5 配置，并在 JSON 文本中插入变量。"
keywords: "VariableJsonTextArea,JSON,JSON5,变量,$env,$user,NocoBase"
---

# VariableJsonTextArea

`VariableJsonTextArea` 用来编辑带变量的 JSON 配置。它基于 [JsonTextArea](./json-text-area)，在右上角加了一个变量选择按钮，选中变量后会把 `{{ ... }}` 表达式插入当前光标位置。

如果 JSON 配置里不需要变量，直接用 [JsonTextArea](./json-text-area) 更简单。

## 基本用法

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

```tsx
import { VariableJsonTextArea } from '@nocobase/client-v2';

<VariableJsonTextArea
  json5
  rows={8}
  namespaces={['$env', '$user']}
  value={{ endpoint: '{{ $env.API_ENDPOINT }}' }}
  onChange={(value) => {
    console.log(value);
  }}
/>;
```

## API

`VariableJsonTextArea` 继承 [JsonTextArea](./json-text-area) 的参数，另外支持：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `namespaces` | `string[]` | 限定变量选择器里的顶层命名空间 |
| `extraNodes` | `MetaTreeNode[]` | 追加局部变量节点 |
| `metaTree` | `MetaTreeNode[] \| () => MetaTreeNode[] \| Promise<MetaTreeNode[]>` | 完全自定义变量树 |
| `delimiters` | `[string, string]` | 变量分隔符，默认 `['{{', '}}']` |
| `formatPathToValue` | `(meta) => string \| undefined` | 自定义变量路径格式化 |

## 相关链接

- [JsonTextArea](./json-text-area) — 编辑普通 JSON / JSON5 配置
- [VariableInput](./variable-input) — 单行变量输入
