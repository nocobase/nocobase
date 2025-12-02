:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estilos e Temas

Para se adaptar melhor às capacidades de tema dinâmico do NocoBase, recomendamos usar o [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) para escrever estilos em seus **plugins**. Isso pode ser combinado com o [token de tema](https://ant.design/docs/react/customize-theme-cn#seedtoken) existente para lidar com as capacidades dinâmicas dos temas. O NocoBase também oferece um **plugin** de [Editor de Tema](#), que você pode usar para ajustar estilos de forma conveniente.

## Escrevendo Estilos

### Usando `createStyles` para Escrever Estilos (Recomendado)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Suporta a sintaxe de objeto CSS
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
  // Também suporta templates de string CSS para uma experiência de escrita consistente com CSS comum
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
  // O objeto `styles` é armazenado em cache por padrão no método `useStyles`, então não se preocupe com problemas de re-renderização
  const { styles, cx, theme } = useStyles();

  return (
    // Use `cx` para organizar o `className`
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* O objeto `theme` contém todos os tokens e informações do tema */}
      <div>Modo de tema atual: {theme.appearance}</div>
    </div>
  );
};
```

Para uso detalhado, consulte a [API `createStyles`](https://ant-design.github.io/antd-style/zh-CN/api/create-styles)

### Usando `createStylish` para Criar um Estilo Reutilizável

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
  // Suporta a sintaxe de objeto CSS
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Também suporta templates de string CSS para uma experiência de escrita consistente com CSS comum
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

Para uso detalhado, consulte a [API `createStylish`](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish)

### Usando `createGlobalStyle` para Injetar Estilos Globais

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
      <div className="some-class">Texto com estilo global</div>
    </div>
  );
};
```

Para uso detalhado, consulte a [API `createGlobalStyle`](https://ant-design.github.io/antd-style/zh-CN/api/global-styles)

## Personalizando Temas

### Usando o `theme token` do antd

Exemplo com `createStyles`

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
          <Button title={'Descrição para o botão de função'} icon={<SmileOutlined />} />
          Botão de ação
        </Space>
        <div className={styles.defaultCard}>Cartão padrão</div>
        <div className={styles.primaryCard}>Cartão principal</div>
      </Space>
    </div>
  );
};

export default App;
```

Exemplo com `createGlobalStyle`

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
      <button className="ant-custom-button">Botão que não existe no antd</button>
    </ThemeProvider>
  );
};
```

## Depurando Temas

### Usando o **plugin** Editor de Tema

![Editor de Tema](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)