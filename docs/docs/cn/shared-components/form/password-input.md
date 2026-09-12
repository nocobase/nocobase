---
title: "PasswordInput"
description: "PasswordInput：Antd Input.Password 加密码强度提示条。"
keywords: "PasswordInput,Input.Password,密码强度,client-v2,NocoBase"
---

# PasswordInput

`PasswordInput` 是 Antd `Input.Password` 的轻量封装。打开 `checkStrength` 后，会在输入框下方显示密码强度提示条。

## 基本用法

```tsx file="../_demos/password-input.tsx" preview
```

在表单里使用：

```tsx
import { PasswordInput } from '@nocobase/client-v2';

<Form.Item name="newPassword" label={t('New password')} rules={[{ required: true }]}>
  <PasswordInput autoComplete="new-password" checkStrength />
</Form.Item>;
```

## API

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `checkStrength` | `boolean` | `false` | 是否显示密码强度提示条 |

其他参数继承 Antd `Input.Password`。

:::warning 注意

强度条只是界面提示，不是表单校验。弱密码能不能提交，仍然取决于 `Form.Item.rules`、服务端校验或单独的密码策略插件。

:::
