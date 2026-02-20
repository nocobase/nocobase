:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Stilar och teman

För att bättre anpassa sig till NocoBase dynamiska temafunktioner rekommenderas det att använda [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) för att skriva stilar i plugins. Detta kan kombineras med befintliga [theme token](https://ant.design/docs/react/customize-theme-cn#seedtoken) för att hantera temanens dynamiska funktioner. NocoBase erbjuder också ett [plugin för temaredigeraren](#) för smidiga stiljusteringar.

## Skriva stilar

### Använda createStyles för att skriva stilar (rekommenderas)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Stöder syntax för css-objekt
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
  // Stöder även CSS-strängmallar för en konsekvent skrivupplevelse som vanlig CSS
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
  // styles-objektet cachelagras som standard i useStyles-metoden, så ni behöver inte oroa er för problem med omrendering
  const { styles, cx, theme } = useStyles();

  return (
    // Använd cx för att organisera className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* theme-objektet innehåller alla tokens och temainformation */}
      <div>Aktuellt temaläge: {theme.appearance}</div>
    </div>
  );
};
```

För detaljerad användning, se [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles)

### Använda createStylish för att skapa en återanvändbar stil

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
  // Stöder syntax för css-objekt
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stöder även CSS-strängmallar för en konsekvent skrivupplevelse som vanlig CSS
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

För detaljerad användning, se [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish)

### Använda createGlobalStyle för att injicera globala stilar

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
      <div className="some-class">Globalt stylad text</div>
    </div>
  );
};
```

För detaljerad användning, se [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles)

## Anpassa teman

### Använda antd:s theme token

createStyles exempel

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
          <Button title={'Beskrivning för funktionsknappen'} icon={<SmileOutlined />} />
          Åtgärdsknapp
        </Space>
        <div className={styles.defaultCard}>Standardkort</div>
        <div className={styles.primaryCard}>Primärt kort</div>
      </Space>
    </div>
  );
};

export default App;
```

createGlobalStyle exempel

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
      <button className="ant-custom-button">Knapp som inte finns i antd</button>
    </ThemeProvider>
  );
};
```

## Felsöka teman

### Använda plugin för temaredigeraren

![Temaredigeraren](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)