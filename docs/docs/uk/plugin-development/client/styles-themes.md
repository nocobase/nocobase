:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Стилі та теми

Щоб краще адаптуватися до можливостей динамічних тем NocoBase, у плагінах рекомендується використовувати [antd-style](https://ant-design.github.io/antd-style/guide) для написання стилів. Це можна поєднати з наявними [токенами теми](https://ant.design/docs/react/customize-theme#seedtoken) для керування динамічними можливостями тем. NocoBase також надає [плагін](#) редактора тем для зручного налаштування стилів.

## Написання стилів

### Використання `createStyles` для написання стилів (рекомендовано)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Підтримує синтаксис об'єкта css
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
  // Також підтримує рядкові шаблони css для послідовного написання, як у звичайному css
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
  // Об'єкт styles за замовчуванням кешується в методі useStyles, тому не турбуйтеся про проблеми з повторним рендерингом
  const { styles, cx, theme } = useStyles();

  return (
    // Використовуйте cx для організації className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* Об'єкт theme містить усі токени та інформацію про тему */}
      <div>Поточний режим теми: {theme.appearance}</div>
    </div>
  );
};
```

Докладніше про використання дивіться в [createStyles API](https://ant-design.github.io/antd-style/api/create-styles).

### Використання `createStylish` для створення стилю, що можна повторно використовувати

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
  // Підтримує синтаксис об'єкта css
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Також підтримує рядкові шаблони css для послідовного написання, як у звичайному css
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

Докладніше про використання дивіться в [createStylish API](https://ant-design.github.io/antd-style/api/create-stylish).

### Використання `createGlobalStyle` для впровадження глобальних стилів

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
      <div className="some-class">Текст з глобальним стилем</div>
    </div>
  );
};
```

Докладніше про використання дивіться в [createGlobalStyle API](https://ant-design.github.io/antd-style/api/global-styles).

## Налаштування тем

### Використання токенів теми `antd`

Приклад `createStyles`

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
          <Button title={'Опис функціональної кнопки'} icon={<SmileOutlined />} />
          Кнопка дії
        </Space>
        <div className={styles.defaultCard}>Звичайна картка</div>
        <div className={styles.primaryCard}>Основна картка</div>
      </Space>
    </div>
  );
};

export default App;
```

Приклад `createGlobalStyle`

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
      <button className="ant-custom-button">Кнопка, якої немає в antd</button>
    </ThemeProvider>
  );
};
```

## Налагодження тем

### Використання [плагіна](#) редактора тем

![Редактор тем](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)