:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# สไตล์และธีม

เพื่อให้ NocoBase สามารถปรับเปลี่ยนธีมแบบไดนามิกได้ดียิ่งขึ้น ในปลั๊กอิน เราขอแนะนำให้ใช้ [antd-style](https://ant-design.github.io/antd-style/zh-CN/guide) ในการเขียนสไตล์ครับ/ค่ะ ซึ่งสามารถนำไปใช้ร่วมกับ [theme token](https://ant.design/docs/react/customize-theme-cn#seedtoken) ที่มีอยู่ เพื่อจัดการความสามารถในการปรับเปลี่ยนธีมแบบไดนามิกครับ/ค่ะ นอกจากนี้ NocoBase ยังมี [ปลั๊กอินตัวแก้ไขธีม](#) ให้ใช้งาน เพื่อช่วยให้คุณปรับแต่งสไตล์ได้อย่างสะดวกสบายครับ/ค่ะ

## การเขียนสไตล์

### การใช้ createStyles ในการเขียนสไตล์ (แนะนำ)

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  // รองรับการเขียนแบบ CSS object
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
  // และยังรองรับการใช้ CSS string template เพื่อประสบการณ์การเขียนที่สอดคล้องกับ CSS ทั่วไป
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
  // ออบเจกต์ styles จะถูกแคชไว้โดยค่าเริ่มต้นในเมธอด useStyles ดังนั้นจึงไม่ต้องกังวลเรื่องปัญหา re-render ครับ/ค่ะ
  const { styles, cx, theme } = useStyles();

  return (
    // ใช้ cx เพื่อจัดระเบียบ className
    <div
      className={cx('a-simple-create-style-demo-classname', styles.container)}
    >
      <div className={styles.card}>createStyles Demo</div>
      {/* ออบเจกต์ theme จะมีข้อมูล token และธีมทั้งหมดครับ/ค่ะ */}
      <div>โหมดธีมปัจจุบัน: {theme.appearance}</div>
    </div>
  );
};
```

ดูรายละเอียดการใช้งานเพิ่มเติมได้ที่ [createStyles API](https://ant-design.github.io/antd-style/zh-CN/api/create-styles) ครับ/ค่ะ

### การใช้ createStylish เพื่อสร้างสไตล์ที่นำกลับมาใช้ใหม่ได้

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
  // รองรับการเขียนแบบ CSS object
  container: {
    backgroundColor: '#f5f5f5',
    maxWidth: 400,
    width: '100%',
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // และยังรองรับการใช้ CSS string template เพื่อประสบการณ์การเขียนที่สอดคล้องกับ CSS ทั่วไป
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

ดูรายละเอียดการใช้งานเพิ่มเติมได้ที่ [createStylish API](https://ant-design.github.io/antd-style/zh-CN/api/create-stylish) ครับ/ค่ะ

### การใช้ createGlobalStyle เพื่อกำหนดสไตล์แบบ Global

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
      <div className="some-class">ข้อความที่จัดสไตล์แบบ Global</div>
    </div>
  );
};
```

ดูรายละเอียดการใช้งานเพิ่มเติมได้ที่ [createGlobalStyle API](https://ant-design.github.io/antd-style/zh-CN/api/global-styles) ครับ/ค่ะ

## การปรับแต่งธีม

### การใช้ theme token ของ antd

ตัวอย่าง createStyles

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
          <Button title={'คำอธิบายสำหรับปุ่มฟังก์ชัน'} icon={<SmileOutlined />} />
          ปุ่มดำเนินการ
        </Space>
        <div className={styles.defaultCard}>การ์ดทั่วไป</div>
        <div className={styles.primaryCard}>การ์ดหลัก</div>
      </Space>
    </div>
  );
};

export default App;
```

ตัวอย่าง createGlobalStyle

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
      <button className="ant-custom-button">ปุ่มที่ไม่มีอยู่ใน antd</button>
    </ThemeProvider>
  );
};
```

## การดีบักธีม

### การใช้ปลั๊กอินตัวแก้ไขธีม

![ตัวแก้ไขธีม](https://static-docs.nocobase.com/440f844d056a485f9f0dc64a8ca1b4f4.png)