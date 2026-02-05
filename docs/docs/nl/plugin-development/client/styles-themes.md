:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Stijlen & Thema's

Om optimaal gebruik te maken van de dynamische themamogelijkheden van NocoBase, raden we u aan om in plugins [antd-style](https://ant-design.github.io/antd-style/guide) te gebruiken voor het schrijven van stijlen. Combineer dit met de bestaande [theme token](https://ant.design/docs/react/customize-theme#seedtoken) om de dynamische aspecten van thema's te beheren. NocoBase biedt ook een [Thema-editor plugin](#) voor het eenvoudig aanpassen van stijlen.

## Stijlen schrijven

### Stijlen schrijven met createStyles (aanbevolen)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Ondersteunt de css object-syntax
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
  // Ondersteunt ook CSS-stringtemplates voor een consistente schrijfstijl, vergelijkbaar met reguliere CSS
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
  // Het 'styles'-object wordt standaard in de useStyles-methode gecached, dus u hoeft zich geen zorgen te maken over re-render problemen
  const { styles, cx, theme } = useStyles();

  return (
    // Gebruik 'cx' om classNames te organiseren
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* Het 'theme'-object bevat alle tokens en themainformatie */}
      <div>Huidige themamodus: {theme.appearance}</div>
    </div>
  );
};
```

Voor gedetailleerd gebruik, zie de [createStyles API](https://ant-design.github.io/antd-style/api/create-styles).

### Een herbruikbare stijl creëren met createStylish

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
  // Ondersteunt de css object-syntax
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ondersteunt ook CSS-stringtemplates voor een consistente schrijfstijl, vergelijkbaar met reguliere CSS
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

Voor gedetailleerd gebruik, zie de [createStylish API](https://ant-design.github.io/antd-style/api/create-stylish).

### Globale stijlen injecteren met createGlobalStyle

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
      <div className="some-class">Globaal gestylde tekst</div>
    </div>
  );
};
```

Voor gedetailleerd gebruik, zie de [createGlobalStyle API](https://ant-design.github.io/antd-style/api/global-styles).

## Thema's aanpassen

### antd's theme token gebruiken

createStyles Voorbeeld

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
          <Button title={'Beschrijving voor de functieknop'} icon={<SmileOutlined />} />
          Actieknop
        </Space>
        <div className={styles.defaultCard}>Standaard kaart</div>
        <div className={styles.primaryCard}>Primaire kaart</div>
      </Space>
    </div>
  );
};

export default App;
```

createGlobalStyle Voorbeeld

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
      <button className="ant-custom-button">Knop die niet bestaat in antd</button>
    </ThemeProvider>
  );
};
```

## Thema's debuggen

### De Thema-editor plugin gebruiken

![Thema-editor](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)