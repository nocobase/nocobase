---
title: "Styles & Themes"
description: "NocoBase Client-Style-Entwicklung: createStyles, createStylish, createGlobalStyle, Antd Theme Tokens, Theme-Editor."
keywords: "Styles,Themes,Stile,Theme,createStyles,createStylish,Antd Theme Token,NocoBase"
---

# Styles & Themes

In NocoBase wird empfohlen, [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) für die Style-Entwicklung von Components zu verwenden. Es lässt sich mit den [Theme Tokens](https://ant.design/docs/react/customize-theme-cn#seedtoken) von Antd kombinieren, um eine dynamische Theme-Anpassung zu erreichen — beispielsweise automatische Unterstützung des Dark-Mode.

NocoBase stellt außerdem ein [Theme-Editor-Plugin](#theme-debuggen) bereit, mit dem sich Theme-Variablen direkt in der Oberfläche anpassen lassen.

## Stile schreiben

### createStyles (empfohlen)

`createStyles` ist die am häufigsten verwendete Schreibweise für Stile und unterstützt sowohl CSS-Object- als auch CSS-Template-Literal-Syntax:

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // CSS-Object-Schreibweise
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
  // CSS-Template-Literal-Schreibweise
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
  // Das styles-Objekt wird gecached, Sie müssen sich keine Gedanken über Re-Renders machen
  const { styles, cx, theme } = useStyles();

  return (
    <div className={cx('a-simple-create-style-demo-classname', styles.container)}>
      <div className={styles.card}>createStyles Demo</div>
      <div>Aktueller Theme-Modus: {theme.appearance}</div>
    </div>
  );
};
```

Ausführliche Verwendung siehe [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles).

### createStylish

`createStylish` dient zum Erstellen wiederverwendbarer Style-Snippets, geeignet zum Teilen von Stilen zwischen mehreren Components:

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

Ausführliche Verwendung siehe [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish).

### createGlobalStyle

`createGlobalStyle` dient zum Einfügen globaler Stile. Wird in der Regel selten verwendet, da `createStyles` für die meisten Szenarien ausreicht:

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
      <div className="some-class">Die Lieblingsfarbe echter Männer</div>
    </div>
  );
};
```

Ausführliche Verwendung siehe [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles).

## Theme Tokens verwenden

Die Theme Tokens von Antd lassen sich direkt in `createStyles` und `createGlobalStyle` verwenden. Über Tokens werden Farben, Abstände, Eckenradien und andere Variablen referenziert, sodass Components automatisch auf Theme-Wechsel (einschließlich Dark-Mode) reagieren können.

### Verwendung in createStyles

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
          <Button title={'Beschreibung der Aktionsschaltfläche'} icon={<SmileOutlined />} />
          Aktionsschaltfläche
        </Space>
        <div className={styles.defaultCard}>Standard-Karte</div>
        <div className={styles.primaryCard}>Hauptkarte</div>
      </Space>
    </div>
  );
};

export default App;
```

### Verwendung in createGlobalStyle

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
      <button className="ant-custom-button">Eine Schaltfläche, die es in antd nicht gibt</button>
    </ThemeProvider>
  );
};
```

Die vollständige Token-Liste finden Sie unter [Antd Seed Token](https://ant.design/docs/react/customize-theme-cn#seedtoken).

## Theme debuggen

NocoBase stellt ein Theme-Editor-Plugin bereit, mit dem sich Theme-Variablen in Echtzeit in der Oberfläche vorschauen und anpassen lassen:

![Theme-Editor](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)

## Verwandte Links

- [Component-Entwicklung](../component/index.md) — Zurück zur Component-Entwicklungsübersicht
- [antd-style Dokumentation](https://ant-design.github.io/antd-style/zh-CN/guide) — Vollständige Dokumentation zu createStyles
- [Antd Theme Token](https://ant.design/docs/react/customize-theme-cn#seedtoken) — Vollständige Token-Liste
