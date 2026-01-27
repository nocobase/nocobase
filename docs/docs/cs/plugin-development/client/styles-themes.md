:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Styly a témata

Abychom lépe využili možnosti dynamických témat NocoBase, doporučujeme v pluginech pro psaní stylů používat [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide). To lze zkombinovat se stávajícími [theme tokeny](https://ant.design/docs/react/customize-theme-cn#seedtoken) pro správu dynamických možností témat. NocoBase také nabízí [plugin Editor témat](#), který slouží k pohodlnému nastavení stylů.

## Psaní stylů

### Psaní stylů pomocí createStyles (doporučeno)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Podporuje syntaxi css objektu
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
  // Podporuje také šablony css řetězců pro konzistentní psaní jako u běžného css
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
  // Objekt styles je ve výchozím nastavení v metodě useStyles cachován, takže se nemusíte obávat problémů s re-renderováním
  const { styles, cx, theme } = useStyles();

  return (
    // Pomocí cx můžete organizovat className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* Objekt theme obsahuje všechny tokeny a informace o tématu */}
      <div>Aktuální režim tématu: {theme.appearance}</div>
    </div>
  );
};
```

Podrobné použití naleznete v [API createStyles](https://ant-design.github.io/antd-style/zh-CN/api/create-styles).

### Vytvoření znovupoužitelného stylu pomocí createStylish

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
  // Podporuje syntaxi css objektu
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Podporuje také šablony css řetězců pro konzistentní psaní jako u běžného css
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

Podrobné použití naleznete v [API createStylish](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish).

### Vkládání globálních stylů pomocí createGlobalStyle

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
      <div className="some-class">Globálně stylovaný text</div>
    </div>
  );
};
```

Podrobné použití naleznete v [API createGlobalStyle](https://ant-design.github.io/antd-style/zh-CN/api/global-styles).

## Přizpůsobení témat

### Použití theme tokenů z antd

Příklad s createStyles

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
          <Button title={'Popis funkčního tlačítka'} icon={<SmileOutlined />} />
          Akční tlačítko
        </Space>
        <div className={styles.defaultCard}>Běžná karta</div>
        <div className={styles.primaryCard}>Primární karta</div>
      </Space>
    </div>
  );
};

export default App;
```

Příklad s createGlobalStyle

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
      <button className="ant-custom-button">Tlačítko, které v antd neexistuje</button>
    </ThemeProvider>
  );
};
```

## Ladění témat

### Použití pluginu Editor témat

![Editor témat](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)