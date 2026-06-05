:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 스타일 및 테마

NocoBase의 동적 테마 기능을 더 잘 활용하기 위해 플러그인에서 [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide)을 사용하여 스타일을 작성하는 것을 권장합니다. 기존 [테마 토큰](https://ant.design/docs/react/customize-theme-cn#seedtoken)과 함께 사용하여 테마의 동적 기능을 구현할 수 있습니다. 또한 NocoBase는 스타일을 편리하게 조정할 수 있는 [테마 편집기 플러그인](#)을 제공합니다.

## 스타일 작성하기

### createStyles를 사용하여 스타일 작성하기 (권장)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // CSS 객체 구문 지원
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
  // 일반 CSS와 일관된 작성 경험을 위해 CSS 문자열 템플릿도 지원
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
  // styles 객체는 useStyles 메서드에서 기본적으로 캐시되므로, 리렌더링 문제에 대해 걱정할 필요가 없습니다.
  const { styles, cx, theme } = useStyles();

  return (
    // cx를 사용하여 className을 구성할 수 있습니다.
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* theme 객체는 모든 토큰과 테마 정보를 포함합니다. */}
      <div>현재 테마 모드: {theme.appearance}</div>
    </div>
  );
};
```

자세한 사용법은 [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles)를 참고하세요.

### createStylish를 사용하여 재사용 가능한 스타일 생성하기

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
  // CSS 객체 구문 지원
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 일반 CSS와 일관된 작성 경험을 위해 CSS 문자열 템플릿도 지원
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

자세한 사용법은 [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish)를 참고하세요.

### createGlobalStyle을 사용하여 전역 스타일 주입하기

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
      <div className="some-class">전역 스타일이 적용된 텍스트</div>
    </div>
  );
};
```

자세한 사용법은 [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles)를 참고하세요.

## 테마 사용자 지정하기

### antd의 테마 토큰 사용하기

createStyles 예시

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
          <Button title={'기능 버튼에 대한 설명'} icon={<SmileOutlined />} />
          동작 버튼
        </Space>
        <div className={styles.defaultCard}>일반 카드</div>
        <div className={styles.primaryCard}>주요 카드</div>
      </Space>
    </div>
  );
};

export default App;
```

createGlobalStyle 예시

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
      <button className="ant-custom-button">antd에 없는 버튼</button>
    </ThemeProvider>
  );
};
```

## 테마 디버깅하기

### 테마 편집기 플러그인 사용하기

![테마 편집기](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)