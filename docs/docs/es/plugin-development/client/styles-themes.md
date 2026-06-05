:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Estilos y Temas

Para adaptarse mejor a las capacidades de temas dinámicos de NocoBase, le recomendamos usar [antd-style](https://ant-design.github.io/antd-style/guide) para escribir estilos en sus plugins. Esto se puede combinar con los [tokens de tema](https://ant.design/docs/react/customize-theme#seedtoken) existentes para gestionar las capacidades dinámicas de los temas. Además, NocoBase ofrece un [plugin de Editor de Temas](#) para ajustar los estilos de forma práctica.

## Escribir Estilos

### Usar createStyles para escribir estilos (recomendado)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Admite la sintaxis de objeto CSS
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
  // También admite plantillas de cadena CSS para una experiencia de escritura consistente con CSS regular
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
  // El objeto styles se almacena en caché por defecto en el método useStyles, así que no se preocupe por problemas de re-renderizado
  const { styles, cx, theme } = useStyles();

  return (
    // Use cx para organizar className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>Demostración de createStyles</div>
      {/* El objeto theme contiene todos los tokens e información del tema */}
      <div>Modo de tema actual: {theme.appearance}</div>
    </div>
  );
};
```

Para un uso detallado, consulte la [API de createStyles](https://ant-design.github.io/antd-style/api/create-styles)

### Usar createStylish para crear un estilo reutilizable

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

    containerBgHover: css`
      cursor: pointer;
      transition: 150ms background-color ease-in-out;

      &:hover {
        background: ${token.colorFillQuaternary};
      }
    `,

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
  // Admite la sintaxis de objeto CSS
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // También admite plantillas de cadena CSS para una experiencia de escritura consistente con CSS regular
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
        Botón stylish
      </div>
    </div>
  );
};
```

Para un uso detallado, consulte la [API de createStylish](https://ant-design.github.io/antd-style/api/create-stylish)

### Usar createGlobalStyle para inyectar estilos globales

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
      <div className="some-class">Texto con estilo global</div>
    </div>
  );
};
```

Para un uso detallado, consulte la [API de createGlobalStyle](https://ant-design.github.io/antd-style/api/global-styles)

## Personalizar Temas

### Usar los tokens de tema de antd

Ejemplo de createStyles

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
          <Button title={'Descripción del botón de función'} icon={<SmileOutlined />} />
          Botón de acción
        </Space>
        <div className={styles.defaultCard}>Tarjeta predeterminada</div>
        <div className={styles.primaryCard}>Tarjeta principal</div>
      </Space>
    </div>
  );
};

export default App;
```

Ejemplo de createGlobalStyle

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
      <button className="ant-custom-button">Botón que no existe en antd</button>
    </ThemeProvider>
  );
};
```

## Depurar Temas

### Usar el plugin de Editor de Temas

![Editor de Temas](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)