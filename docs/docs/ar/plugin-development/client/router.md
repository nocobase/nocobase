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

أضف مسارات الصفحات العادية باستخدام `router.add()`. بالنسبة لمكونات الصفحات، يجب استخدام `componentLoader` للتسجيل عند الطلب، بحيث لا يتم تحميل وحدة الصفحة إلا عند الدخول الفعلي إلى المسار.

يجب أن تستخدم ملفات الصفحات `export default`:

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
      // استيراد ديناميكي: لا يتم تحميل وحدة الصفحة إلا عند الدخول إلى هذا المسار
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

يدعم المعلمات الديناميكية

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

إذا كانت الصفحة ثقيلة أو ليست مطلوبة في العرض الأول، فالأفضل استخدام `componentLoader`. ويظل `element` مناسبًا لمسارات التخطيط أو الصفحات المضمنة الخفيفة جدًا.

## توسيع صفحات إعدادات الإضافة

أضف صفحات إعدادات الإضافة باستخدام `pluginSettingsRouter.add()`. وعلى غرار مسارات الصفحات العادية، يجب أيضًا استخدام `componentLoader` في صفحات الإعدادات.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // عنوان صفحة الإعدادات
      icon: 'ApiOutlined', // أيقونة قائمة صفحة الإعدادات
      // استيراد ديناميكي: لا يتم تحميل وحدة الصفحة إلا عند الدخول إلى صفحة الإعدادات هذه
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // المسارات الفرعية
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // استيراد ديناميكي: لا يتم تحميل وحدة الصفحة إلا عند الدخول إلى صفحة الإعدادات هذه
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```
