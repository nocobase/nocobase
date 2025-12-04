:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# סגנונות ועיצובים

כדי להתאים טוב יותר ליכולות העיצוב הדינמיות של NocoBase, מומלץ להשתמש ב-[antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) לכתיבת סגנונות בתוספים. ניתן לשלב זאת עם ה-[theme token](https://ant.design/docs/react/customize-theme-cn#seedtoken) הקיים כדי לטפל ביכולות הדינמיות של העיצובים. בנוסף, NocoBase מספקת גם [תוסף עורך עיצובים](#) שניתן להשתמש בו להתאמות סגנון נוחות.

## כתיבת סגנונות

### שימוש ב-createStyles לכתיבת סגנונות (מומלץ)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // תומך בתחביר של אובייקט css
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
  // תומך גם בתבניות מחרוזת css לחווית כתיבה עקבית עם css רגיל
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
  // אובייקט ה-styles נשמר במטמון כברירת מחדל בשיטת useStyles, כך שאין צורך לדאוג לבעיות re-render
  const { styles, cx, theme } = useStyles();

  return (
    // השתמשו ב-cx כדי לארגן את ה-className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>הדגמת createStyles</div>
      {/* אובייקט ה-theme מכיל את כל ה-tokens ומידע על העיצוב */}
      <div>מצב העיצוב הנוכחי: {theme.appearance}</div>
    </div>
  );
};
```

לשימוש מפורט, עיינו ב-[createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles)

### שימוש ב-createStylish ליצירת סגנון שניתן לשימוש חוזר

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
  // תומך בתחביר של אובייקט css
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // תומך גם בתבניות מחרוזת css לחווית כתיבה עקבית עם css רגיל
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
        כפתור stylish
      </div>
    </div>
  );
};
```

לשימוש מפורט, עיינו ב-[createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish)

### שימוש ב-createGlobalStyle להזרקת סגנונות גלובליים

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
      <div className="some-class">טקסט עם סגנון גלובלי</div>
    </div>
  );
};
```

לשימוש מפורט, עיינו ב-[createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles)

## התאמה אישית של עיצובים

### שימוש ב-theme token של antd

דוגמת createStyles

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
          <Button title={'תיאור כפתור הפונקציה'} icon={<SmileOutlined />} />
          כפתור פעולה
        </Space>
        <div className={styles.defaultCard}>כרטיס רגיל</div>
        <div className={styles.primaryCard}>כרטיס ראשי</div>
      </Space>
    </div>
  );
};

export default App;
```

דוגמת createGlobalStyle

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
      <button className="ant-custom-button">כפתור שאינו קיים ב-antd</button>
    </ThemeProvider>
  );
};
```

## איתור באגים בעיצובים

### שימוש בתוסף עורך העיצובים

![עורך עיצובים](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)