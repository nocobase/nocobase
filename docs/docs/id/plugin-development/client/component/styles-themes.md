---
title: "Styles & Themes"
description: "Pengembangan Styles client NocoBase: createStyles, createStylish, createGlobalStyle, antd theme token, theme editor."
keywords: "Styles,Themes,createStyles,createStylish,antd theme token,NocoBase"
---

# Styles & Themes

Di NocoBase, direkomendasikan menggunakan [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) untuk menulis Styles Component. Ini dapat dikombinasikan dengan [theme token](https://ant.design/docs/react/customize-theme-cn#seedtoken) Antd untuk mengaktifkan adaptasi Theme dinamis — misalnya mendukung dark mode secara otomatis.

NocoBase juga menyediakan [plugin theme editor](#调试主题), yang memungkinkan Anda menyesuaikan variabel Theme langsung di antarmuka.

## Menulis Styles

### createStyles (Direkomendasikan)

`createStyles` adalah cara paling umum untuk menulis Styles, mendukung dua cara: CSS object dan template string CSS:

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Cara penulisan CSS object
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
  // Cara penulisan template string CSS
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
  // Object styles akan di-cache, tidak perlu khawatir tentang masalah re-render
  const { styles, cx, theme } = useStyles();

  return (
    <div className={cx('a-simple-create-style-demo-classname', styles.container)}>
      <div className={styles.card}>createStyles Demo</div>
      <div>Mode Theme saat ini: {theme.appearance}</div>
    </div>
  );
};
```

Untuk penggunaan detail lihat [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles).

### createStylish

`createStylish` digunakan untuk membuat fragmen Styles yang dapat digunakan kembali, cocok untuk berbagi Styles antar beberapa Component:

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

Untuk penggunaan detail lihat [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish).

### createGlobalStyle

`createGlobalStyle` digunakan untuk menyuntikkan Styles global. Biasanya jarang digunakan, untuk sebagian besar skenario `createStyles` sudah cukup:

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
      <div className="some-class">Warna favorit pria sejati</div>
    </div>
  );
};
```

Untuk penggunaan detail lihat [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles).

## Menggunakan theme token

Theme token Antd dapat digunakan langsung di `createStyles` dan `createGlobalStyle`. Dengan mereferensikan variabel warna, jarak, border radius, dll. melalui token, Component dapat secara otomatis beradaptasi dengan pergantian Theme (termasuk dark mode).

### Menggunakan di createStyles

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
          <Button title={'Deskripsi tombol fungsi'} icon={<SmileOutlined />} />
          Tombol Action
        </Space>
        <div className={styles.defaultCard}>Card Biasa</div>
        <div className={styles.primaryCard}>Card Utama</div>
      </Space>
    </div>
  );
};

export default App;
```

### Menggunakan di createGlobalStyle

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
      <button className="ant-custom-button">Tombol yang tidak ada di antd</button>
    </ThemeProvider>
  );
};
```

Untuk daftar token lengkap lihat [Antd Seed Token](https://ant.design/docs/react/customize-theme-cn#seedtoken).

## Debugging Theme

NocoBase menyediakan plugin theme editor yang memungkinkan Anda untuk pratinjau dan menyesuaikan variabel Theme secara real-time di antarmuka:

![Theme Editor](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)

## Tautan Terkait

- [Pengembangan Component](../component/index.md) — Kembali ke ikhtisar pengembangan Component
- [Dokumentasi antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) — Dokumentasi lengkap createStyles
- [Antd Theme Token](https://ant.design/docs/react/customize-theme-cn#seedtoken) — Daftar token lengkap
