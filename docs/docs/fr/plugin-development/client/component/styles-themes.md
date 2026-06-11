---
title: "Styles & Thèmes"
description: "Développement de styles côté client NocoBase : createStyles, createStylish, createGlobalStyle, theme tokens d'Antd, éditeur de thème."
keywords: "Styles,Thèmes,createStyles,createStylish,antd theme token,NocoBase"
---

# Styles & Thèmes

Dans NocoBase, il est recommandé d'utiliser [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) pour écrire les styles des composants. Combiné aux [theme tokens](https://ant.design/docs/react/customize-theme-cn#seedtoken) d'Antd, il permet une adaptation dynamique du thème — par exemple le support automatique du mode sombre.

NocoBase fournit également un [plugin d'éditeur de thème](#déboguer-le-thème) pour ajuster les variables de thème directement depuis l'interface.

## Écrire des styles

### createStyles (recommandé)

`createStyles` est l'écriture la plus courante ; elle supporte à la fois la notation CSS object et les templates string CSS :

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Notation CSS object
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
  // Template string CSS
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
  // L'objet styles est mis en cache, pas de souci de re-render
  const { styles, cx, theme } = useStyles();

  return (
    <div className={cx('a-simple-create-style-demo-classname', styles.container)}>
      <div className={styles.card}>createStyles Demo</div>
      <div>Mode de thème actuel : {theme.appearance}</div>
    </div>
  );
};
```

Référence détaillée : [API createStyles](https://ant-design.github.io/antd-style/zh-CN/api/create-styles).

### createStylish

`createStylish` sert à créer des fragments de style réutilisables, partagés entre plusieurs composants :

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

Référence détaillée : [API createStylish](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish).

### createGlobalStyle

`createGlobalStyle` injecte des styles globaux. On l'utilise généralement peu : `createStyles` suffit dans la plupart des cas :

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
      <div className="some-class">La couleur préférée des hommes virils</div>
    </div>
  );
};
```

Référence détaillée : [API createGlobalStyle](https://ant-design.github.io/antd-style/zh-CN/api/global-styles).

## Utiliser les theme tokens

Les theme tokens d'Antd peuvent être utilisés directement dans `createStyles` et `createGlobalStyle`. En référençant les variables de couleur, d'espacement, d'arrondi via les tokens, vos composants s'adaptent automatiquement aux changements de thème (y compris le mode sombre).

### Dans createStyles

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
          <Button title={'Description du bouton'} icon={<SmileOutlined />} />
          Bouton d'action
        </Space>
        <div className={styles.defaultCard}>Carte standard</div>
        <div className={styles.primaryCard}>Carte principale</div>
      </Space>
    </div>
  );
};

export default App;
```

### Dans createGlobalStyle

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
      <button className="ant-custom-button">Bouton inexistant dans antd</button>
    </ThemeProvider>
  );
};
```

Liste complète des tokens : [Antd Seed Token](https://ant.design/docs/react/customize-theme-cn#seedtoken).

## Déboguer le thème

NocoBase fournit un plugin d'éditeur de thème qui permet de prévisualiser et d'ajuster les variables de thème en temps réel depuis l'interface :

![Éditeur de thème](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)

## Liens connexes

- [Développement de composants Component](../component/index.md) — retour à l'aperçu du développement de composants
- [Documentation antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) — documentation complète de createStyles
- [Antd Theme Token](https://ant.design/docs/react/customize-theme-cn#seedtoken) — liste complète des tokens
