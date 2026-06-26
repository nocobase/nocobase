---
title: "CodeScanner"
description: "CodeScanner：底层全屏扫码器。"
keywords: "CodeScanner,扫码,二维码,条形码,client-v2,NocoBase"
---

# CodeScanner

`CodeScanner` 是底层全屏扫码器。通常来说，直接用 [ScanInput](./scan-input) 就够了。只有当你已经有自己的输入框，只想控制扫码弹层时，才需要直接使用它。

## 基本用法

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => {
    setValue(text);
  }}
/>;
```

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `visible` | `boolean` | 是否显示扫码器 |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | 限定识别格式 |
| `onClose` | `() => void` | 关闭扫码器时触发 |
| `onScanSuccess` | `(result: string) => void` | 识别成功时触发 |

:::warning 注意

浏览器扫码依赖摄像头权限和 HTTPS 环境。本地调试或移动端 WebView 中遇到权限问题时，优先检查浏览器权限、协议和 JSBridge 注入情况。

:::

## 相关链接

- [ScanInput](./scan-input) — 带扫码按钮的输入框
