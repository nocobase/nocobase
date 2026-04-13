---
title: "Styles & Themes 样式与主题"
description: "NocoBase 客户端样式开发：createStyles、createStylish、createGlobalStyle、antd theme token、主题编辑器。"
keywords: "Styles,Themes,样式,主题,createStyles,createStylish,antd theme token,NocoBase"
---

# Styles & Themes 样式与主题

在 NocoBase 中，推荐使用 [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) 来编写组件样式。它可以配合 Antd 的 [theme token](https://ant.design/docs/react/customize-theme-cn#seedtoken) 实现动态主题适配——比如自动支持暗色模式。

NocoBase 还提供了[主题编辑器插件](#调试主题)，可以在界面上直接调整主题变量。

## 编写样式

### createStyles（推荐）

`createStyles` 是最常用的样式写法，支持 CSS object 和 CSS 字符串模板两种方式：

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // CSS object 写法
  container: {
    backgroundColor: token.colorBgLayout,
    borderRadius: token.borderRadiusLG,
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  // CSS 字符串模板写法
  card: css`
    color: ${token.colorTextTertiary};
    box-shadow: ${token.boxShadow};
    &:hover {
      color: ${token.colorTextSecondary};
      box-shadow: ${token.boxShadowSecondary};
    }
    padding: ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
    transition: all 100ms ${token.motionEaseInBack};
    margin-bottom: 8px;
    cursor: pointer;
  `,
}));

export default () => {
  // styles 对象会被缓存，不用担心 re-render 问题
  const { styles, cx, theme } = useStyles();

  return (
    <div className={cx('a-simple-create-style-demo-classname', styles.container)}>
      <div className={styles.card}>createStyles Demo</div>
      <div>当前主题模式：{theme.appearance}</div>
    </div>
  );
};
```

详细用法参考 [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles)。

### createStylish

`createStylish` 用于创建可复用的样式片段，适合在多个组件之间共享样式：

```tsx
import { createStyles, createStylish, css } from 'antd-style';

const useStylish = createStylish(({ token, css }) => {
  const containerBgHover = css`
    cursor: pointer;
    transition: 150ms background-color ease-in-out;
    &:hover {
      background: ${token.colorFillQuaternary};
    }
  `;

  const defaultButtonBase = css`
    color: ${token.colorTextSecondary};
    background: ${token.colorFillQuaternary};
    border-color: transparent;
  `;

  return {
    defaultButton: css`
      ${defaultButtonBase};
      &:hover {
        color: ${token.colorText};
        background: ${token.colorFillSecondary};
        border-color: transparent;
      }
      &:focus {
        ${defaultButtonBase};
        border-color: ${token.colorPrimary};
      }
    `,

    containerBgHover,

    containerBgL2: css`
      ${containerBgHover};
      border-radius: 4px;
      background: ${token.colorFillQuaternary};
      &:hover {
        background: ${token.colorFillTertiary};
      }
    `,
  };
});

const useStyles = createStyles({
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: css`
    padding: 24px;
  `,
});

export default () => {
  const { styles, cx } = useStyles();
  const stylish = useStylish();

  return (
    <div className={styles.container}>
      <div className={cx(styles.btn, stylish.defaultButton)}>
        stylish Button
      </div>
    </div>
  );
};
```

详细用法参考 [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish)。

### createGlobalStyle

`createGlobalStyle` 用于注入全局样式。通常来说用得比较少，大部分场景 `createStyles` 就够了：

```tsx
import { createGlobalStyle } from 'antd-style';

const Global = createGlobalStyle`
  .some-class {
    color: hotpink;
  }
`;

export default () => {
  return (
    <div>
      <Global />
      <div className="some-class">猛男最喜欢的颜色</div>
    </div>
  );
};
```

详细用法参考 [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles)。

## 使用 theme token

Antd 的 theme token 可以在 `createStyles` 和 `createGlobalStyle` 中直接使用。通过 token 引用颜色、间距、圆角等变量，组件就能自动适配主题切换（包括暗色模式）。

### 在 createStyles 中使用

```tsx
import { SmileOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  const commonCard = css`
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingLG}px;
  `;

  return {
    container: css`
      background-color: ${token.colorBgLayout};
      padding: 24px;
    `,
    primaryCard: css`
      ${commonCard};
      background: ${token.colorPrimary};
      color: ${token.colorTextLightSolid};
    `,
    defaultCard: css`
      ${commonCard};
      background: ${token.colorBgContainer};
      color: ${token.colorText};
    `,
  };
});

const App = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <Space direction={'vertical'} style={{ width: '100%' }} size={16}>
        <Space>
          <Button title={'功能按钮的说明'} icon={<SmileOutlined />} />
          操作按钮
        </Space>
        <div className={styles.defaultCard}>普通卡片</div>
        <div className={styles.primaryCard}>主要卡片</div>
      </Space>
    </div>
  );
};

export default App;
```

### 在 createGlobalStyle 中使用

```tsx
import { createGlobalStyle, ThemeProvider } from 'antd-style';

const Global = createGlobalStyle`
  .ant-custom-button {
    color: ${(p) => p.theme.colorPrimary};
    background: ${(p) => p.theme.colorPrimaryBg};
    height: ${(p) => p.theme.controlHeight}px;
    border-radius: ${(p) => p.theme.borderRadius}px;
    padding: 0 ${(p) => p.theme.paddingContentHorizontal}px;

    :hover {
      background: ${(p) => p.theme.colorPrimaryBgHover};
      color: ${(p) => p.theme.colorPrimaryTextActive};
    }

    :active {
      background: ${(p) => p.theme.colorPrimaryBorder};
      color: ${(p) => p.theme.colorPrimaryText};
    }

    border: none;
    cursor: pointer;
  }
`;

export default () => {
  return (
    <ThemeProvider>
      <Global />
      <button className="ant-custom-button">antd 中不存在的按钮</button>
    </ThemeProvider>
  );
};
```

完整的 token 列表参考 [Antd Seed Token](https://ant.design/docs/react/customize-theme-cn#seedtoken)。

## 调试主题

NocoBase 提供了主题编辑器插件，可以在界面上实时预览和调整主题变量：

![主题编辑器](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)

## 相关链接

- [Component 组件开发](../component/index.md) — 回到组件开发概述
- [antd-style 文档](https://ant-design.github.io/antd-style/zh-CN/guide) — createStyles 完整文档
- [Antd Theme Token](https://ant.design/docs/react/customize-theme-cn#seedtoken) — 完整 token 列表
