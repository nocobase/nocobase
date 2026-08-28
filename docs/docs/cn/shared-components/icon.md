---
title: "Icon"
description: "Icon：统一使用 Ant Design 图标、Iconfont 图标和自定义图标组件。"
keywords: "Icon,Ant Design Icons,Iconfont,自定义图标,NocoBase"
---

# Icon

`Icon` 是 `@nocobase/client-v2` 的统一图标入口。默认已经注册了 `@ant-design/icons` 里的图标，可以通过字符串名称渲染。

## 基本用法

```tsx file="./_demos/icon.tsx" preview
```

```tsx
import { Icon } from '@nocobase/client-v2';

<Icon type="SettingOutlined" />;
```

图标名称不区分大小写。找不到图标时返回 `null`。

## 自定义图标

可以注册一组图标组件：

```tsx
import { Icon } from '@nocobase/client-v2';
import { MyIcon } from './MyIcon';

Icon.register({
  MyIcon,
});

<Icon type="MyIcon" />;
```

也可以直接传 `component`，用法和 Ant Design `Icon` 一致：

```tsx
<Icon component={MySvg} />;
```

## Iconfont

如果项目接入了 Iconfont：

```tsx
Icon.createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_xxx.js',
});

<Icon type="icon-custom" />;
```

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 图标名称 |
| `component` | `React.ComponentType` | 自定义 SVG 组件 |

其他参数会透传给实际图标组件，比如 `style`、`className`、`spin`。

附带方法：

| 方法 | 说明 |
| --- | --- |
| `Icon.register(components)` | 批量注册自定义图标 |
| `Icon.createFromIconfontCN(options)` | 注册 Iconfont 图标入口 |
| `hasIcon(type)` | 判断某个图标是否已注册 |
| `registerIcon(type, icon)` | 注册单个图标 |
| `registerIcons(components)` | 批量注册图标 |
