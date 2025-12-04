:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Style i motywy

Aby lepiej wykorzystać dynamiczne możliwości motywów w NocoBase, w wtyczkach zalecamy używanie [antd-style](https://ant-design.github.io/antd-style/guide) do pisania stylów. Można to połączyć z istniejącymi [tokenami motywu](https://ant-design.github.io/antd-design/docs/react/customize-theme#seedtoken) w celu obsługi dynamicznych funkcji motywów. NocoBase oferuje również [wtyczkę Edytor motywów](#), która ułatwia dostosowywanie stylów.

## Pisanie stylów

### Pisanie stylów za pomocą createStyles (zalecane)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Obsługuje składnię obiektu css
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
  // Obsługuje również szablony ciągów css dla spójnego doświadczenia pisania ze zwykłym css
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
  // Obiekt styles jest domyślnie buforowany w metodzie useStyles, więc nie trzeba martwić się o problemy z ponownym renderowaniem
  const { styles, cx, theme } = useStyles();

  return (
    // Użyj cx do organizacji className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* Obiekt theme zawiera wszystkie tokeny i informacje o motywie */}
      <div>Aktualny tryb motywu: {theme.appearance}</div>
    </div>
  );
};
```

Szczegółowe informacje na temat użycia znajdą Państwo w [API createStyles](https://ant-design.github.io/antd-style/api/create-styles).

### Używanie createStylish do tworzenia stylów wielokrotnego użytku

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
  // Obsługuje składnię obiektu css
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Obsługuje również szablony ciągów css dla spójnego doświadczenia pisania ze zwykłym css
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

Szczegółowe informacje na temat użycia znajdą Państwo w [API createStylish](https://ant-design.github.io/antd-style/api/create-stylish).

### Wstrzykiwanie stylów globalnych za pomocą createGlobalStyle

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
      <div className="some-class">Tekst ostylowany globalnie</div>
    </div>
  );
};
```

Szczegółowe informacje na temat użycia znajdą Państwo w [API createGlobalStyle](https://ant-design.github.io/antd-style/api/global-styles).

## Dostosowywanie motywów

### Używanie tokenów motywu antd

Przykład createStyles

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
          <Button title={'Opis przycisku funkcyjnego'} icon={<SmileOutlined />} />
          Przycisk akcji
        </Space>
        <div className={styles.defaultCard}>Karta domyślna</div>
        <div className={styles.primaryCard}>Karta główna</div>
      </Space>
    </div>
  );
};

export default App;
```

Przykład createGlobalStyle

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
      <button className="ant-custom-button">Przycisk, który nie istnieje w antd</button>
    </ThemeProvider>
  );
};
```

## Debugowanie motywów

### Używanie wtyczki Edytor motywów

![Edytor motywów](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)