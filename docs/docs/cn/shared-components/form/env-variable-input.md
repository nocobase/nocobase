---
title: "EnvVariableInput"
description: "EnvVariableInput：只允许选择 $env 环境变量的变量输入。"
keywords: "EnvVariableInput,$env,变量输入,环境变量,NocoBase"
---

# EnvVariableInput

`EnvVariableInput` 是面向环境变量的输入组件。它只暴露 `$env` 命名空间，适合密钥、凭证和连接参数。

开启 `password` 后，非变量字面值会用 Antd `Input.Password` 遮盖；变量表达式仍然可以通过变量选择器编辑。

## 基本用法

```tsx file="../_demos/env-variable-input.tsx" preview
```

```tsx
import { EnvVariableInput } from '@nocobase/client-v2';

<Form.Item name={['options', 'accessKeySecret']} label={t('Access Key Secret')}>
  <EnvVariableInput password />
</Form.Item>;
```

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `string` | 当前值 |
| `onChange` | `(value: string) => void` | 值变化回调 |
| `addonBefore` | `React.ReactNode` | 前置内容 |
| `disabled` | `boolean` | 是否禁用 |
| `password` | `boolean` | 是否遮盖非变量字面值 |
| `placeholder` | `string` | 占位文字 |

## 相关链接

- [VariableInput](./variable-input) — 通用单行变量输入
- [TypedVariableInput](./typed-variable-input) — 同时支持常量和变量
