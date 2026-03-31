:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Стили и темы

Чтобы лучше адаптироваться к возможностям динамических тем NocoBase, в плагинах рекомендуется использовать [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) для написания стилей. Это позволяет использовать существующие [токены темы](https://ant.design/docs/react/customize-theme-cn#seedtoken) для управления динамическими возможностями тем. Кроме того, NocoBase предлагает [плагин Редактор тем](#) для удобной настройки стилей.

## Написание стилей

### Использование createStyles для написания стилей (рекомендуется)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // Поддерживает синтаксис CSS-объектов
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
  // Также поддерживает строковые шаблоны CSS для единообразного написания стилей, как в обычном CSS.
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
  // Объект styles по умолчанию кэшируется в методе useStyles, поэтому не беспокойтесь о проблемах с повторным рендерингом.
  const { styles, cx, theme } = useStyles();

  return (
    // Используйте cx для организации className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* Объект theme содержит все токены и информацию о теме */}
      <div>Текущий режим темы: {theme.appearance}</div>
    </div>
  );
};
```

Подробное описание использования см. в [API createStyles](https://ant-design.github.io/antd-style/zh-CN/api/create-styles).

### Использование createStylish для создания переиспользуемых стилей

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
  // Поддерживает синтаксис CSS-объектов
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Также поддерживает строковые шаблоны CSS для единообразного написания стилей, как в обычном CSS.
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

Подробное описание использования см. в [API createStylish](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish).

### Использование createGlobalStyle для внедрения глобальных стилей

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
      <div className="some-class">Текст с глобальными стилями</div>
    </div>
  );
};
```

Подробное описание использования см. в [API createGlobalStyle](https://ant-design.github.io/antd-style/zh-CN/api/global-styles).

## Настройка тем

### Использование токенов темы antd

Пример createStyles

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
          <Button title={'Описание функциональной кнопки'} icon={<SmileOutlined />} />
          Кнопка действия
        </Space>
        <div className={styles.defaultCard}>Обычная карточка</div>
        <div className={styles.primaryCard}>Основная карточка</div>
      </Space>
    </div>
  );
};

export default App;
```

Пример createGlobalStyle

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
      <button className="ant-custom-button">Кнопка, отсутствующая в antd</button>
    </ThemeProvider>
  );
};
```

## Отладка тем

### Использование плагина Редактор тем

![Редактор тем](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)