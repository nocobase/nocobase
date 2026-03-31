:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Styles et Thèmes

Pour tirer pleinement parti des capacités de thème dynamique de NocoBase, nous vous recommandons d'utiliser [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) pour écrire vos styles dans les plugins. Vous pouvez ensuite combiner cela avec les [jetons de thème](https://ant.design/docs/react/customize-theme-cn#seedtoken) existants pour gérer les aspects dynamiques de vos thèmes. NocoBase propose également un [plugin d'éditeur de thème](#) pour faciliter l'ajustement des styles.

## Écrire des styles

### Utiliser `createStyles` pour écrire des styles (recommandé)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Prend en charge la syntaxe d'objet CSS
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
  // Prend également en charge les modèles de chaînes CSS pour une expérience d'écriture cohérente avec le CSS standard
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
  // L'objet styles est mis en cache par défaut dans la méthode useStyles, vous n'avez donc pas à vous soucier des problèmes de re-rendu.
  const { styles, cx, theme } = useStyles();

  return (
    // Utilisez cx pour organiser les noms de classes (className)
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* L'objet theme contient tous les jetons et informations de thème. */}
      <div>Mode de thème actuel : {theme.appearance}</div>
    </div>
  );
};
```

Pour une utilisation détaillée, consultez l'[API createStyles](https://ant-design.github.io/antd-style/zh-CN/api/create-styles).

### Utiliser `createStylish` pour créer un style réutilisable

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
  // Prend en charge la syntaxe d'objet CSS
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Prend également en charge les modèles de chaînes CSS pour une expérience d'écriture cohérente avec le CSS standard
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

Pour une utilisation détaillée, consultez l'[API createStylish](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish).

### Utiliser `createGlobalStyle` pour injecter des styles globaux

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
      <div className="some-class">Texte stylisé globalement</div>
    </div>
  );
};
```

Pour une utilisation détaillée, consultez l'[API createGlobalStyle](https://ant-design.github.io/antd-style/zh-CN/api/global-styles).

## Personnaliser les thèmes

### Utiliser les jetons de thème d'Ant Design

Exemple `createStyles`

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
          <Button title={'Description du bouton de fonction'} icon={<SmileOutlined />} />
          Bouton d'action
        </Space>
        <div className={styles.defaultCard}>Carte par défaut</div>
        <div className={styles.primaryCard}>Carte principale</div>
      </Space>
    </div>
  );
};

export default App;
```

Exemple `createGlobalStyle`

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
      <button className="ant-custom-button">Bouton qui n'existe pas dans Ant Design</button>
    </ThemeProvider>
  );
};
```

## Déboguer les thèmes

### Utiliser le plugin d'éditeur de thème

![Éditeur de thème](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)