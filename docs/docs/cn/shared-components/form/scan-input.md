---
title: "ScanInput"
description: "ScanInput：在输入框中支持二维码、条形码扫描。"
keywords: "ScanInput,扫码,二维码,条形码,client-v2,NocoBase"
---

# ScanInput

`ScanInput` 是带扫码按钮的 Antd `Input`。点击按钮后，优先调用移动端 `window.JsBridge.invoke({ action: 'scan' })`；如果没有 JSBridge，则打开浏览器摄像头扫码界面。

## 基本用法

```tsx file="../_demos/scan-input.tsx" preview
```

在表单里使用：

```tsx
import { ScanInput } from '@nocobase/client-v2';

<Form.Item name="code" label={t('Code')}>
  <ScanInput placeholder={t('Scan or input code')} />
</Form.Item>;
```

## API

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `disableManualInput` | `boolean` | `false` | 是否禁用手动输入，开启后输入框只读 |
| `enableScan` | `boolean` | - | 保留参数，当前组件始终渲染扫码按钮 |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | 内置常用二维码和条形码格式 | 限定识别格式 |
| `onChange` | `(value: string \| ChangeEvent<HTMLInputElement>) => void` | - | 扫码成功时传字符串，手动输入时传原始事件 |

其他参数继承 Antd `Input`。

:::warning 注意

浏览器扫码依赖摄像头权限和 HTTPS 环境。本地调试或移动端 WebView 中遇到权限问题时，优先检查浏览器权限、协议和 JSBridge 注入情况。

:::

## 相关链接

- [CodeScanner](./code-scanner) — 只使用底层全屏扫码器
