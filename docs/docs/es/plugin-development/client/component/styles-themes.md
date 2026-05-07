---
title: "Styles & Themes — estilos y temas"
description: "Desarrollo de estilos en el cliente de NocoBase: createStyles, createStylish, createGlobalStyle, theme tokens de antd y editor de temas."
keywords: "Styles,Themes,estilos,temas,createStyles,createStylish,antd theme token,NocoBase"
---

# Styles & Themes — estilos y temas

En NocoBase se recomienda usar [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) para escribir los estilos de los componentes. Combinado con los [theme token](https://ant.design/docs/react/customize-theme-cn#seedtoken) de Antd permite adaptar el tema de forma dinámica, por ejemplo soportar el modo oscuro automáticamente.

NocoBase ofrece además un [plugin de editor de temas](#depurar-el-tema) que permite ajustar las variables del tema directamente desde la interfaz.

## Escritura de estilos

### createStyles (recomendado)

`createStyles` es la forma más habitual de escribir estilos. Admite tanto objeto CSS como plantillas de cadena CSS:

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Forma de objeto CSS
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
  // Forma de plantilla CSS
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
  // El objeto styles se cachea, no debe preocuparse por el re-render
  const { styles, cx, theme } = useStyles();

  return (
    <div className={cx('a-simple-create-style-demo-classname', styles.container)}>
      <div className={styles.card}>createStyles Demo</div>
      <div>Modo de tema actual: {theme.appearance}</div>
    </div>
  );
};
```

Para más detalles, consulte la [API de createStyles](https://ant-design.github.io/antd-style/zh-CN/api/create-styles).

### createStylish

`createStylish` permite crear fragmentos de estilo reutilizables, ideal para compartir estilos entre varios componentes:

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

Para más detalles, consulte la [API de createStylish](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish).

### createGlobalStyle

`createGlobalStyle` se usa para inyectar estilos globales. Suele utilizarse poco; en la mayoría de los escenarios `createStyles` es suficiente:

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
      <div className="some-class">El color favorito de los hombres rudos</div>
    </div>
  );
};
```

Para más detalles, consulte la [API de createGlobalStyle](https://ant-design.github.io/antd-style/zh-CN/api/global-styles).

## Uso de los theme token

Los theme tokens de Antd se pueden usar directamente en `createStyles` y `createGlobalStyle`. Al referenciar colores, espaciados, radios, etc. mediante tokens, los componentes se adaptan automáticamente al cambio de tema (incluido el modo oscuro).

### Uso en createStyles

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
          <Button title={'Descripción del botón funcional'} icon={<SmileOutlined />} />
          Botón de acción
        </Space>
        <div className={styles.defaultCard}>Tarjeta normal</div>
        <div className={styles.primaryCard}>Tarjeta principal</div>
      </Space>
    </div>
  );
};

export default App;
```

### Uso en createGlobalStyle

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
      <button className="ant-custom-button">Botón inexistente en antd</button>
    </ThemeProvider>
  );
};
```

Lista completa de tokens en [Antd Seed Token](https://ant.design/docs/react/customize-theme-cn#seedtoken).

## Depurar el tema

NocoBase incluye un plugin de editor de temas que permite previsualizar y ajustar variables del tema en tiempo real desde la interfaz:

![Editor de temas](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)

## Enlaces relacionados

- [Desarrollo de Component](../component/index.md): volver a la visión general del desarrollo de componentes.
- [Documentación de antd-style](https://ant-design.github.io/antd-style/zh-CN/guide): documentación completa de `createStyles`.
- [Antd Theme Token](https://ant.design/docs/react/customize-theme-cn#seedtoken): lista completa de tokens.
