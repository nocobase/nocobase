:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# الموجه (Router)

يوفر عميل NocoBase مدير موجه مرنًا يدعم توسيع الصفحات وصفحات إعدادات الإضافة عبر `router.add()` و `pluginSettingsRouter.add()`.

## مسارات الصفحات الافتراضية المسجلة

| الاسم           | المسار               | المكون                | الوصف                      |
| -------------- | ------------------ | ------------------- |--------------------------|
| admin          | `/admin/*`         | `AdminLayout`       | صفحات الإدارة             |
| admin.page     | `/admin/:name`     | `AdminDynamicPage`  | الصفحات التي يتم إنشاؤها ديناميكيًا |
| admin.settings | `/admin/settings/*` | `AdminSettingsLayout` | صفحات إعدادات الإضافة     |

## توسيع الصفحات العادية

أضف مسارات الصفحات العادية باستخدام `router.add()`.

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

يدعم المعلمات الديناميكية

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## توسيع صفحات إعدادات الإضافة

أضف صفحات إعدادات الإضافة باستخدام `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // عنوان صفحة الإعدادات
      icon: 'ApiOutlined', // أيقونة قائمة صفحة الإعدادات
      Component: HelloSettingPage,
    });
  }
}
```

مثال على التوجيه متعدد المستويات

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // مسار المستوى الأعلى
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // المسارات الفرعية
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