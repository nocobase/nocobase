---
title: "VariableInput"
description: "VariableInput：在单行输入框中插入 NocoBase 变量。"
keywords: "VariableInput,变量输入,$env,$user,NocoBase"
---

# VariableInput

`VariableInput` 用来输入字面量和变量表达式。变量来自 `flowEngine.context` 的 meta tree，比如 `$env`、`$user` 或插件自己追加的业务变量。

它是单行输入。变量会显示成 pill，适合标题、主题、URL 片段这类短文本。

```tsx file="../_demos/variable-input.tsx" preview
```

```tsx
import { VariableInput } from '@nocobase/client-v2';

<Form.Item name="subject" label={t('Subject')}>
  <VariableInput
    namespaces={['$env']}
    extraNodes={[
      { name: '$resetLink', title: t('Reset password link'), type: 'string', paths: ['$resetLink'] },
    ]}
  />
</Form.Item>;
```

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `string` | 当前值 |
| `onChange` | `(value: string) => void` | 值变化回调 |
| `disabled` | `boolean` | 是否禁用 |
| `placeholder` | `string` | 占位文字 |
| `addonBefore` | `React.ReactNode` | 前置内容 |
| `namespaces` | `string[]` | 限定可选的顶层命名空间 |
| `extraNodes` | `MetaTreeNode[]` | 追加局部变量节点 |
| `converters` | `VariableHybridInputConverters` | 自定义 path 和字符串的转换 |
| `delimiters` | `[string, string]` | 变量分隔符，默认 `['{{', '}}']` |
| `className` | `string` | 自定义 class |
| `style` | `React.CSSProperties` | 自定义样式 |

## 分隔符

默认分隔符是 `{{` 和 `}}`，对应 NocoBase 服务端模板的 HTML 转义输出。如果字段最终按 HTML 渲染，且变量展开后不能被转义，可以传三花括号：

```tsx
<VariableInput delimiters={['{{{', '}}}']} />
```

:::warning 注意

三花括号会让变量按未转义内容输出。只有在确认渲染链路已经处理安全问题时再使用。

:::

## 相关链接

- [VariableTextArea](./variable-text-area) — 多行变量输入
- [EnvVariableInput](./env-variable-input) — 只允许选择 `$env` 环境变量
- [TypedVariableInput](./typed-variable-input) — 同时支持常量和变量
