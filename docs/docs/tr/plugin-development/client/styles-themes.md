:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Stiller ve Temalar

NocoBase'in dinamik tema yeteneklerine daha iyi uyum sağlamak için, eklentilerde stil yazmak için [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) kullanmanız önerilir. Mevcut [tema token'larını](https://ant.design/docs/react/customize-theme-cn#seedtoken) kullanarak temaların dinamik yeteneklerini yönetebilirsiniz. Ayrıca NocoBase, stilleri kolayca ayarlayabilmeniz için bir [Tema Düzenleyici eklentisi](#) de sunar.

## Stil Yazımı

### createStyles Kullanarak Stil Yazımı (Önerilen)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // CSS nesne sözdizimini destekler
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
  // Ayrıca, standart CSS ile tutarlı bir yazım deneyimi için CSS dize şablonlarını da destekler.
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
  // styles nesnesi, useStyles metodunda varsayılan olarak önbelleğe alınır, bu nedenle yeniden render sorunları hakkında endişelenmenize gerek yoktur.
  const { styles, cx, theme } = useStyles();

  return (
    // className'leri düzenlemek için cx kullanın
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* theme nesnesi tüm token'ları ve tema bilgilerini içerir */}
      <div>Mevcut tema modu: {theme.appearance}</div>
    </div>
  );
};
```

Ayrıntılı kullanım için [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles) belgesine bakabilirsiniz.

### createStylish Kullanarak Yeniden Kullanılabilir Stil Oluşturma

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
  // CSS nesne sözdizimini destekler
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ayrıca, standart CSS ile tutarlı bir yazım deneyimi için CSS dize şablonlarını da destekler.
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

Ayrıntılı kullanım için [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish) belgesine bakabilirsiniz.

### createGlobalStyle Kullanarak Global Stilleri Enjekte Etme

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
      <div className="some-class">Genel olarak stil verilmiş metin</div>
    </div>
  );
};
```

Ayrıntılı kullanım için [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles) belgesine bakabilirsiniz.

## Temaları Özelleştirme

### antd'nin Tema Token'larını Kullanma

createStyles Örneği

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
          <Button title={'İşlev düğmesinin açıklaması'} icon={<SmileOutlined />} />
          Eylem düğmesi
        </Space>
        <div className={styles.defaultCard}>Varsayılan kart</div>
        <div className={styles.primaryCard}>Birincil kart</div>
      </Space>
    </div>
  );
};

export default App;
```

createGlobalStyle Örneği

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
      <button className="ant-custom-button">antd'de bulunmayan düğme</button>
    </ThemeProvider>
  );
};
```

## Temalarda Hata Ayıklama

### Tema Düzenleyici eklentisini Kullanma

![Tema Düzenleyici](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)