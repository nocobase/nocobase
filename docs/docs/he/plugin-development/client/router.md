:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# נתב

לקוח NocoBase מספק מנהל נתבים גמיש, התומך בהרחבת עמודים ועמודי הגדרות של תוספים באמצעות `router.add()` ו-`pluginSettingsRouter.add()`.

## נתיבי עמודים ברירת מחדל רשומים

| שם           | נתיב               | קומפוננטה                | תיאור |
| -------------- | ------------------ | ------------------- |---------|
| admin          | /admin/\*          | AdminLayout         | עמודי ניהול  |
| admin.page     | /admin/:name       | AdminDynamicPage    | עמודים שנוצרו באופן דינמי |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | עמודי הגדרות תוספים  |

## הרחבת עמודים רגילים

הוסף נתיבי עמודים רגילים באמצעות `router.add()`. עבור רכיבי עמוד, יש להשתמש ב-`componentLoader` לרישום לפי דרישה, כך שמודול העמוד ייטען רק כאשר נכנסים בפועל לנתיב.

קובצי עמוד חייבים להשתמש ב-`export default`:

```tsx
// routes/HomePage.tsx
export default function HomePage() {
  return <h1>Home</h1>;
}
```

```tsx
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Layout = () => (
  <div>
    <div>
      <Link to="/">Home</Link> | <Link to="/about">About</Link>
    </div>
    <Outlet />
  </div>
);

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', { element: <Layout /> });

    this.router.add('root.home', {
      path: '/',
      // ייבוא דינמי: מודול העמוד ייטען רק כאשר נכנסים לנתיב הזה
      componentLoader: () => import('./routes/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about',
      componentLoader: () => import('./routes/AboutPage'),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});

export default app.getRootComponent();
```

תומך בפרמטרים דינמיים

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

אם העמוד כבד או שאינו נדרש בציור הראשוני, מומלץ להעדיף `componentLoader`; `element` עדיין מתאים לנתיבי פריסה או לעמודים inline קלי משקל מאוד.

## הרחבת עמודי הגדרות תוספים

הוסף דפי הגדרות של תוסף באמצעות `pluginSettingsRouter.add()`. בדומה לנתיבי עמוד רגילים, גם דפי ההגדרות צריכים להשתמש ב-`componentLoader` לרישום לפי דרישה.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // כותרת עמוד ההגדרות
      icon: 'ApiOutlined', // אייקון תפריט עמוד ההגדרות
      // ייבוא דינמי: מודול העמוד ייטען רק כאשר נכנסים לדף ההגדרות הזה
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

דוגמה לניתוב מרובה רמות

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // נתיב ברמה העליונה
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      element: <Outlet />,
    });

    // נתיבי משנה
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // ייבוא דינמי: מודול העמוד ייטען רק כאשר נכנסים לדף ההגדרות הזה
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```