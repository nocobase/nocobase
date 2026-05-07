---
title: "Styles & Themes スタイルとテーマ"
description: "NocoBase クライアントのスタイル開発：createStyles、createStylish、createGlobalStyle、antd theme token、テーマエディタ。"
keywords: "Styles,Themes,スタイル,テーマ,createStyles,createStylish,antd theme token,NocoBase"
---

# Styles & Themes スタイルとテーマ

NocoBase では、コンポーネントのスタイル記述に [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) の使用を推奨しています。Antd の [theme token](https://ant.design/docs/react/customize-theme-cn#seedtoken) と組み合わせることで、動的なテーマ適応が実現できます。例えばダークモードの自動サポートなどです。

NocoBase は[テーマエディタプラグイン](#テーマのデバッグ)も提供しており、画面上でテーマ変数を直接調整できます。

## スタイルの記述

### createStyles（推奨）

`createStyles` は最もよく使うスタイルの書き方で、CSS object と CSS テンプレートリテラルの2つの方法をサポートしています：

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // CSS object 記法
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
  // CSS テンプレートリテラル記法
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
  // styles オブジェクトはキャッシュされるため、再レンダリングの心配は不要
  const { styles, cx, theme } = useStyles();

  return (
    <div className={cx('a-simple-create-style-demo-classname', styles.container)}>
      <div className={styles.card}>createStyles Demo</div>
      <div>現在のテーマモード：{theme.appearance}</div>
    </div>
  );
};
```

詳しい使い方は [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles) を参照してください。

### createStylish

`createStylish` は再利用可能なスタイル断片を作成するためのもので、複数のコンポーネント間でスタイルを共有する場合に適しています：

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

詳しい使い方は [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish) を参照してください。

### createGlobalStyle

`createGlobalStyle` はグローバルスタイルの注入に使います。通常はあまり使用する機会がなく、ほとんどのシーンでは `createStyles` で十分です：

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
      <div className="some-class">ホットピンクのテキスト</div>
    </div>
  );
};
```

詳しい使い方は [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles) を参照してください。

## theme token の使用

Antd の theme token は `createStyles` と `createGlobalStyle` の中で直接使用できます。token を通じてカラー、間隔、角丸などの変数を参照することで、コンポーネントがテーマの切り替え（ダークモードを含む）に自動的に適応します。

### createStyles 内での使用

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
          <Button title={'機能ボタンの説明'} icon={<SmileOutlined />} />
          操作ボタン
        </Space>
        <div className={styles.defaultCard}>通常カード</div>
        <div className={styles.primaryCard}>プライマリカード</div>
      </Space>
    </div>
  );
};

export default App;
```

### createGlobalStyle 内での使用

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
      <button className="ant-custom-button">antd にはないカスタムボタン</button>
    </ThemeProvider>
  );
};
```

完全な token リストは [Antd Seed Token](https://ant.design/docs/react/customize-theme-cn#seedtoken) を参照してください。

## テーマのデバッグ

NocoBase はテーマエディタプラグインを提供しており、画面上でテーマ変数をリアルタイムにプレビュー・調整できます：

![テーマエディタ](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)

## 関連リンク

- [Component コンポーネント開発](../component/index.md) — コンポーネント開発の概要に戻る
- [antd-style ドキュメント](https://ant-design.github.io/antd-style/zh-CN/guide) — createStyles の完全ドキュメント
- [Antd Theme Token](https://ant.design/docs/react/customize-theme-cn#seedtoken) — 完全な token リスト
