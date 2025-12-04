:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Gaya & Tema

Untuk beradaptasi lebih baik dengan kemampuan tema dinamis NocoBase, dalam **plugin**, disarankan untuk menggunakan [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) untuk menulis gaya. Ini dapat dikombinasikan dengan [token tema](https://ant.design/docs/react/customize-theme-cn#seedtoken) yang sudah ada untuk menangani kemampuan dinamis tema. NocoBase juga menyediakan [**plugin** Editor Tema](#) untuk penyesuaian gaya yang mudah.

## Menulis Gaya

### Menggunakan createStyles untuk Menulis Gaya (Direkomendasikan)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Mendukung sintaks objek css
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
  // Juga mendukung template string css untuk pengalaman penulisan yang konsisten dengan css biasa
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
  // Objek styles di-cache secara default dalam metode useStyles, jadi tidak perlu khawatir tentang masalah re-render
  const { styles, cx, theme } = useStyles();

  return (
    // Gunakan cx untuk mengatur className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* Objek theme berisi semua token dan informasi tema */}
      <div>Mode tema saat ini: {theme.appearance}</div>
    </div>
  );
};
```

Untuk penggunaan detail, lihat [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles)

### Menggunakan createStylish untuk Membuat Gaya yang Dapat Digunakan Kembali

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
  // Mendukung sintaks objek css
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Juga mendukung template string css untuk pengalaman penulisan yang konsisten dengan css biasa
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

Untuk penggunaan detail, lihat [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish)

### Menggunakan createGlobalStyle untuk Menyuntikkan Gaya Global

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
      <div className="some-class">Teks yang diberi gaya global</div>
    </div>
  );
};
```

Untuk penggunaan detail, lihat [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles)

## Menyesuaikan Tema

### Menggunakan token tema antd

Contoh createStyles

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
          <Button title={'Deskripsi untuk tombol fungsi'} icon={<SmileOutlined />} />
          Tombol aksi
        </Space>
        <div className={styles.defaultCard}>Kartu default</div>
        <div className={styles.primaryCard}>Kartu utama</div>
      </Space>
    </div>
  );
};

export default App;
```

Contoh createGlobalStyle

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

## Debugging Tema

### Menggunakan **plugin** Editor Tema

![Editor Tema](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)