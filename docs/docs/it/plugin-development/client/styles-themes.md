:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Stili e Temi

Per adattarsi al meglio alle capacità di tema dinamico di NocoBase, nei **plugin**, si consiglia di utilizzare [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) per scrivere gli stili. Questo può essere combinato con i [token del tema](https://ant.design.github.io/antd-style/zh-CN/guide) esistenti per gestire le capacità dinamiche dei temi. NocoBase offre anche un **plugin** [Editor di Temi](#) per regolare comodamente gli stili.

## Scrivere Stili

### Utilizzare createStyles per scrivere gli stili (Consigliato)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Supporta la sintassi degli oggetti css
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
  // Supporta anche i template di stringa css per un'esperienza di scrittura coerente con il css normale
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
  // L'oggetto styles viene memorizzato nella cache per impostazione predefinita nel metodo useStyles, quindi non preoccupatevi dei problemi di re-render
  const { styles, cx, theme } = useStyles();

  return (
    // Utilizzare cx per organizzare className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* L'oggetto theme contiene tutti i token e le informazioni sul tema */}
      <div>Modalità tema attuale: {theme.appearance}</div>
    </div>
  );
};
```

Per un utilizzo dettagliato, consulti la [API di createStyles](https://ant-design.github.io/antd-style/zh-CN/api/create-styles)

### Utilizzare createStylish per creare uno stile riutilizzabile

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
  // Supporta la sintassi degli oggetti css
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Supporta anche i template di stringa css per un'esperienza di scrittura coerente con il css normale
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

Per un utilizzo dettagliato, consulti la [API di createStylish](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish)

### Utilizzare createGlobalStyle per iniettare stili globali

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
      <div className="some-class">Testo con stile globale</div>
    </div>
  );
};
```

Per un utilizzo dettagliato, consulti la [API di createGlobalStyle](https://ant-design.github.io/antd-style/zh-CN/api/global-styles)

## Personalizzare i Temi

### Utilizzare i token del tema di antd

Esempio con createStyles

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
          <Button title={'Descrizione per il pulsante funzione'} icon={<SmileOutlined />} />
          Pulsante di azione
        </Space>
        <div className={styles.defaultCard}>Scheda predefinita</div>
        <div className={styles.primaryCard}>Scheda principale</div>
      </Space>
    </div>
  );
};

export default App;
```

Esempio con createGlobalStyle

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
      <button className="ant-custom-button">Pulsante non presente in antd</button>
    </ThemeProvider>
  );
};
```

## Debugging dei Temi

### Utilizzare il plugin Editor di Temi

![Editor di Temi](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)