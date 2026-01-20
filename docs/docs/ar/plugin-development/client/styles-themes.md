:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# الأنماط والسمات

للتكيف بشكل أفضل مع إمكانيات NocoBase الديناميكية للسمات، يُوصى باستخدام [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) لكتابة الأنماط في الإضافات (Plugins). يمكن دمج هذا مع [رموز السمات (theme token)](https://ant.design/docs/react/customize-theme-cn#seedtoken) الحالية للتعامل مع القدرات الديناميكية للسمات. كما توفر NocoBase أيضًا [إضافة محرر السمات](#) لتعديل الأنماط بسهولة.

## كتابة الأنماط

### استخدام createStyles لكتابة الأنماط (مُوصى به)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // يدعم صيغة كائن CSS
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
  // يدعم أيضًا قوالب سلاسل CSS لتجربة كتابة متسقة مع CSS العادي
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
  // يتم تخزين كائن الأنماط (styles) مؤقتًا بشكل افتراضي في دالة useStyles، لذا لا داعي للقلق بشأن مشاكل إعادة العرض (re-render)
  const { styles, cx, theme } = useStyles();

  return (
    // استخدم cx لتنظيم أسماء الفئات (className)
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>عرض توضيحي لـ createStyles</div>
      {/* يحتوي كائن السمة (theme) على جميع الرموز (tokens) ومعلومات السمة */}
      <div>وضع السمة الحالي: {theme.appearance}</div>
    </div>
  );
};
```

للاستخدام المفصل، راجع [واجهة برمجة تطبيقات createStyles](https://ant-design.github.io/antd-style/zh-CN/api/create-styles)

### استخدام createStylish لإنشاء نمط قابل لإعادة الاستخدام

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
  // يدعم صيغة كائن CSS
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // يدعم أيضًا قوالب سلاسل CSS لتجربة كتابة متسقة مع CSS العادي
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
        زر Stylish
      </div>
    </div>
  );
};
```

للاستخدام المفصل، راجع [واجهة برمجة تطبيقات createStylish](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish)

### استخدام createGlobalStyle لحقن الأنماط العامة

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
      <div className="some-class">نص بنمط عالمي</div>
    </div>
  );
};
```

للاستخدام المفصل، راجع [واجهة برمجة تطبيقات createGlobalStyle](https://ant-design.github.io/antd-style/zh-CN/api/global-styles)

## تخصيص السمات

### استخدام رموز سمة antd (theme token)

مثال createStyles

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
          <Button title={'وصف زر الوظيفة'} icon={<SmileOutlined />} />
          زر الإجراء
        </Space>
        <div className={styles.defaultCard}>بطاقة افتراضية</div>
        <div className={styles.primaryCard}>بطاقة أساسية</div>
      </Space>
    </div>
  );
};

export default App;
```

مثال createGlobalStyle

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
      <button className="ant-custom-button">زر غير موجود في antd</button>
    </ThemeProvider>
  );
};
```

## تصحيح أخطاء السمات

### استخدام إضافة محرر السمات

![Theme Editor](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)