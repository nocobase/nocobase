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

הוסיפו נתיבי עמודים רגילים באמצעות `router.add()`.

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

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

    this.router.add('root.home', { path: '/', element: <Home /> });
    this.router.add('root.about', { path: '/about', element: <About /> });
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

## הרחבת עמודי הגדרות תוספים

הוסיפו עמודי הגדרות תוספים באמצעות `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // כותרת עמוד ההגדרות
      icon: 'ApiOutlined', // אייקון תפריט עמוד ההגדרות
      Component: HelloSettingPage,
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
      Component: Outlet,
    });

    // נתיבי משנה
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>,
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>,
    });
  }
}
```