---
title: "Styles & Themes estilos e temas"
description: "Desenvolvimento de estilos do cliente NocoBase: createStyles, createStylish, createGlobalStyle, antd theme tokens e editor de tema."
keywords: "Styles,Themes,estilos,temas,createStyles,createStylish,antd theme token,NocoBase"
---

# Styles & Themes estilos e temas

No NocoBase, é recomendado usar [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) para escrever os estilos dos componentes. Ele se integra com os [theme tokens](https://ant.design/docs/react/customize-theme-cn#seedtoken) do Antd para adaptação dinâmica de tema — por exemplo, suporte automático ao modo escuro.

O NocoBase também oferece um [plugin de editor de tema](#depuração-do-tema), no qual você pode ajustar variáveis do tema diretamente na interface.

## Escrevendo estilos

### createStyles (recomendado)

`createStyles` é a forma mais comum de escrever estilos e suporta tanto objeto CSS quanto template string CSS:

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

Para uso detalhado, consulte a [API de createStyles](https://ant-design.github.io/antd-style/zh-CN/api/create-styles).

### createStylish

`createStylish` é usado para criar fragmentos de estilo reutilizáveis, adequado para compartilhar estilos entre vários componentes:

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

Para uso detalhado, consulte a [API de createStylish](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish).

### createGlobalStyle

`createGlobalStyle` é usado para injetar estilos globais. Geralmente é menos utilizado, pois `createStyles` resolve a maioria dos casos:

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

Para uso detalhado, consulte a [API de createGlobalStyle](https://ant-design.github.io/antd-style/zh-CN/api/global-styles).

## Usando theme tokens

Os theme tokens do Antd podem ser usados diretamente em `createStyles` e `createGlobalStyle`. Ao referenciar variáveis como cores, espaçamentos e bordas via tokens, os componentes se adaptam automaticamente à mudança de tema (incluindo o modo escuro).

### Em createStyles

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

### Em createGlobalStyle

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

Para a lista completa de tokens, consulte [Antd Seed Token](https://ant.design/docs/react/customize-theme-cn#seedtoken).

## Depuração do tema

O NocoBase oferece um plugin de editor de tema, com o qual você pode pré-visualizar e ajustar as variáveis do tema em tempo real diretamente pela interface:

![Editor de tema](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)

## Links relacionados

- [Desenvolvimento de Component](../component/index.md) — voltar à visão geral do desenvolvimento de componentes
- [Documentação do antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) — documentação completa de createStyles
- [Antd Theme Token](https://ant.design/docs/react/customize-theme-cn#seedtoken) — lista completa de tokens
